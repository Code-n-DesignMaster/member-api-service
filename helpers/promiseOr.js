module.exports = (promiseA, promiseB) => {
  return promiseA.then(r => {
    if(r) return r;

    return promiseB;
  });
}
