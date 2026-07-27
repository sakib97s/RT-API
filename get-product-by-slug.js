const http = require('http');

const slug = 'tfdyfhfgyhfgh-ythyjgh';

http.get(`http://localhost:3013/api/product/get-by-slug/${slug}?shop=6a4027ff8f92d99c83aa6e87`, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('GET_BY_SLUG_RESPONSE_START');
    console.log(body);
    console.log('GET_BY_SLUG_RESPONSE_END');
  });
});
