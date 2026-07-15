const axios = require('axios');

(async () => {
  try {
    const res = await axios.get('http://localhost:3013/api/product/get-all-data', {
      params: {
        shop: '6a4027ff8f92d99c83aa6e87',
        status: 'publish',
        'tags.name': 'thfhfgh',
        page: 1,
        limit: 6
      }
    });
    console.log("Success:", res.data.success);
    const products = res.data.data || [];
    console.log("Products Count:", products.length);
    if (products.length > 0) {
      console.log("Product:", products[0].name);
    }
  } catch (err) {
  }
})();
