export default (api) => {
  ['beforeSendMessage', 'afterSendMessageSuccess'].forEach((name) => {
    api.registerMethod({ name });
  });
};
