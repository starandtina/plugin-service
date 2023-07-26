export default function plugin1(api) {
  api.beforeSendMessage((m) => {
    m['plugin1.beforeSendMessage'] = 'hello';
  });
}
