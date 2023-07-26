import { AsyncSeriesWaterfallHook } from 'tapable';
import lodash from 'lodash';
import plugin1 from './plugin1';
import plugin2 from './plugin2';
import registerMethodsPlugin from './registerMethodsPlugin';

export class Hook {
  plugin;
  key;
  fn;
  before;
  stage;
  constructor(opts) {
    this.plugin = opts.plugin;
    this.key = opts.key;
    this.fn = opts.fn;
    this.before = opts.before;
    this.stage = opts.stage || 0;
  }
}

class PluginAPI {
  service;
  plugin;
  constructor(opts) {
    this.service = opts.service;
    this.plugin = opts.plugin;
  }
  register(opts) {
    this.service.hooks[opts.key] ||= [];
    this.service.hooks[opts.key].push(
      new Hook({ ...opts, plugin: this.plugin })
    );
  }
  // : { name: string; fn?: Function }
  registerMethod(opts) {
    this.service.pluginMethods[opts.name] = {
      plugin: this.plugin,
      fn:
        opts.fn ||
        function (fn) {
          this.register({
            key: opts.name,
            ...(lodash.isPlainObject(fn) ? fn : { fn }),
          });
        },
    };
  }
  // {
  //   pluginAPI,
  //   service,
  //   serviceProps,
  //   staticProps
  // }
  static proxyPluginAPI(opts) {
    return new Proxy(opts.pluginAPI, {
      get: (target, prop) => {
        if (opts.service.pluginMethods[prop]) {
          return opts.service.pluginMethods[prop].fn;
        }
        if (opts.serviceProps.includes(prop)) {
          const serviceProp = opts.service[prop];
          return typeof serviceProp === 'function'
            ? serviceProp.bind(opts.service)
            : serviceProp;
        }
        if (prop in opts.staticProps) {
          return opts.staticProps[prop];
        }

        return target[prop];
      },
    });
  }
}

class PluginService {
  hooks = {};
  pluginMethods = {};
  constructor(opts = {}) {
    this.opts = opts;

    this.initPlugins(this.opts.plugins);
  }
  applyPlugins(opts) {
    const hooks = this.hooks[opts.key] ?? [];
    const asyncSeriesWaterfallHook = new AsyncSeriesWaterfallHook(['memo']);
    for (const hook of hooks) {
      asyncSeriesWaterfallHook.tapPromise(
        {
          name: hook.plugin.key || 'plugin',
          stage: hook.stage || 0,
          before: hook.before,
        },
        async (memo) => {
          // const dateStart = new Date();
          const ret = await hook.fn(memo, opts.args);
          // hook.plugin.time.hooks[opts.key] ||= [];
          // hook.plugin.time.hooks[opts.key].push(
          //   new Date().getTime() - dateStart.getTime()
          // );
          return ret;
        }
      );
    }
    return asyncSeriesWaterfallHook.promise(opts.initialValue || []);
  }
  initPlugins(plugins = []) {
    for (const plugin of plugins) {
      const pluginAPI = new PluginAPI({
        plugin,
        service: this,
      });
      const proxyPluginAPI = PluginAPI.proxyPluginAPI({
        service: this,
        pluginAPI,
        serviceProps: ['applyPlugins'],
        staticProps: {},
      });

      plugin(proxyPluginAPI);
    }
  }
}

const service = new PluginService({
  plugins: [registerMethodsPlugin, plugin1, plugin2],
});

const message = { content: 'm1' };
service.applyPlugins({
  key: 'beforeSendMessage',
  initialValue: { message },
});

////

service
  .applyPlugins({
    key: 'afterSendMessageSuccess',
    initialValue: { message },
  })
  .then((r) => console.log(r));
