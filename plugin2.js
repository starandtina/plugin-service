export default function plugin2(api) {
  api.afterSendMessageSuccess((m) => {
    m['plugin2.afterSendMessageSuccess'] = 'world';
  });

  api.beforeSendMessage((m) => {
    m.tplId = '1123';
  });
}
