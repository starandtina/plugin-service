export default (api) => {
  api.beforeSendMessage((m) => {
    console.log('plugin1.beforeSendMessage', m);
  });
};
