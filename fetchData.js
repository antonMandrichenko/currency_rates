function fetchRates(query) {
  return fetch("https://api.exchangeratesapi.io/" + query)
    .then(response =>{
      if(response.ok) return response.json();
      throw new Error('Network response was not ok.');
    })
    .then(data => {
      return data;
    })
    .catch((e) => alert(`Error ${e.name}: ${e.message} \n ${e.stack}`) );
}
