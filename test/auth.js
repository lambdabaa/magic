setup(() => {
  let ref = new Firebase('https://mtgstats.firebaseio.com');
  return ref.authWithCustomToken('tTxh4X9b1gGIySp4XvSFvuTcf50Pt0XnSxoCYN49');
});
