const axios = require('axios');

(async () => {
  try {
    const res = await axios.get('http://localhost:3013/api/tag/get-all-data', {
      params: {
        shop: '6a4027ff8f92d99c83aa6e87',
      }
    });
    console.log("Success:", res.data.success);
    const tags = res.data.data || [];
    console.log("Tags Count:", tags.length);
    for (let t of tags) {
       console.log(`Tag: ${t.name}`);
    }
  } catch (err) {
  }
})();
