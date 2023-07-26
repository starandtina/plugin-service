export default (api) => {
  api.afterSendMessageSuccess((m) => {
    m.code = 1;

    console.log('plugin2.afterSendMessageSuccess', m);
  });

  api.beforeSendMessage((m) => {
    m.tplId = '123';
  });
};
