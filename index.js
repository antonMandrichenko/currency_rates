"use strict";
class ForeignExchangeRates {
  constructor() {
    this.divRoot = $("#root");
    this.currenciesList = null;
    this.tabCalculator = null;
    this.tabHistorycal = null;
    this.tabLatest = null;
    this.historicalList = null;
    this.date = moment(new Date()).format("DD.MM.YYYY");
    this.data = null;

    this.divRoot.on("keypress", (e) => {
      if(e.target.nodeName === "INPUT") {
        const num = /[0-9,\.]/;
        if (!num.test(e.key)) e.preventDefault();
      }
    });

    this.divRoot.on("input", e => {
      if (e.target.type === "text"
        || e.target.nodeName === "SELECT") {
        this.courseCalculation(e.target);
      }
    });

    this.divRoot.on("change", e =>{
      const target = e.target;
      const input = $(".control")[0];
      try {
        if (target.type === "radio") {
          if ($(".form-check-input")[1] === target) {
            const calendar = $("#calendar")[0];
            calendar.disabled = false;
            if(calendar.value) {
              this.date = moment(calendar.value).format("DD.MM.YYYY");
              this.data = JSON.parse(localStorage.getItem(this.date));
              this.courseCalculation(input);
            }
          } else {
            calendar.disabled = true;
            this.date = moment(new Date()).format("DD.MM.YYYY");
            this.data = JSON.parse(localStorage.getItem(this.date));
            this.courseCalculation(input);
          }
        }
        if (target.id === "calendar"
          || target.id === "calendar2") {
          if (target.value === ""
            || moment(target.value) < moment("1999-01-02")
            || moment(target.value) > moment(new Date())) {
            throw new Error(
              "Enter valid date. Date must be later 1999-01-02 or earlier today"
            );
          }
          this.date = moment(target.value).format("DD.MM.YYYY");
          if(target.id === "calendar"){
            fetchRates(moment(target.value).format("YYYY-MM-DD"))
              .then(res => {
                this.getData(res);
                this.courseCalculation($(".control")[0]);
              })
          } else {
            $("#historical_rates")[0].innerHTML += this.showSpinner();
            const historyList = $(".historical-list")[0];

            fetchRates(moment(target.value).format("YYYY-MM-DD"))
              .then(res => {

                this.getData(res);
                if(historyList) historyList.remove();
                this.createHistoricalList();
                this.destroySpinner();
              })
          }
        }

      } catch (err){
        alert(err.message)
      }
    })
  }

  init() {
    this.divRoot.innerHTML = this.showSpinner();
    fetchRates('latest')
      .then(res => {
        this.getData(res);
        this.currenciesList = Object.keys(this.data.rates);
        this.currenciesList.unshift("EUR");
        this.renderView();
      });
    this.destroySpinner();
  }

  getData(result) {
    this.setInLocaleStorage(this.date, result);
    this.data = result;
  }

  renderView() {
    let tabs = ` <nav>
                    <div class="nav nav-tabs" id="nav-tab" role="tablist">
                      <a  class="nav-item nav-link active" 
                          id="nav-calculator-tab" 
                          data-toggle="tab" 
                          href="#calculator">
                         Calculator
                      </a>
                      <a  class="nav-item nav-link" 
                          id="nav-latest-rates-tab" 
                          data-toggle="tab" 
                          href="#latest_rates">
                         Latest rates
                       </a>
                      <a  class="nav-item nav-link" 
                          id="nav-historical-rates-tab" 
                          data-toggle="tab" 
                          href="#historical_rates">
                         Historical rates
                      </a>
                    </div>
                  </nav>
                  <div  class="tab-content" 
                        id="nav-tabContent">
                    <div  class="tab-pane fade show active" 
                          id="calculator">
                      <div  class="spinner-border" 
                            role="status">
                        <span class="sr-only">
                          Loading...
                        </span>
                      </div>
                    </div>
                    <div  class="tab-pane fade" 
                          id="latest_rates">
                    </div>
                    <div  class="tab-pane fade" 
                          id="historical_rates">
                    </div>                     
                  </div>`;
    this.divRoot[0].innerHTML += tabs;
    this.tabCalculator = this.divRoot.find("#calculator")[0];
    this.tabLatest = this.divRoot.find("#latest_rates")[0];
    this.tabHistorical = this.divRoot.find("#historical_rates")[0];
    this.tabCalculator.innerHTML = this.createTabCalculator();
    this.tabLatest.innerHTML = this.createTabLatestRates();
    this.tabHistorical.innerHTML = this.createTabHistoricalRates();
    this.courseCalculation($(".control")[0]);
    this.spinner = this.divRoot.find(".spinner-border");
  }

  createTabCalculator() {
    let outHTML = `<div class="form-check form-inline">
                        <input  class="form-check-input" 
                                type="radio" 
                                name="radios" 
                                id="radios1" 
                                value="option1" 
                                checked>
                        <label class="form-check-label" for="radios1">
                          Currencies rates by ${moment(new Date()).format("DD.MM.YY")}
                        </label>
                      </div>
                      <div class="form-check form-inline">
                        <input  class="form-check-input" 
                                type="radio" 
                                name="radios" 
                                id="radios2" 
                                value="option2">
                        <label class="form-check-label" for="radios2">
                          <input  class="form-control" 
                                  type="date" 
                                  id="calendar" 
                                  min="1999-01-02"
                                  max=${moment(new Date()).format("YYYY-MM-DD")}
                                  disabled>
                        </label>
                    </div>`;
    outHTML += this.createFormInline("USD", "firstCur");
    outHTML += this.createFormInline("GBP", "secondCur");
    return outHTML;
  }

  createTabLatestRates() {
    let outHTML = `<h5>
                    Foreign exchange rates for 
                    <strong>
                      ${this.date}
                    </strong> 
                    by base currency: 
                    <strong>
                      ${this.data.base}
                    </strong>
                    </h5>
                    <h5>
                      Rates of 1 ${this.data.base}:
                    </h5>`;
    for (let key in this.data.rates) {
      outHTML += `<p><strong>${this.data.rates[key]}</strong> ${key}</p>`
    }
    return outHTML;
  }

  createTabHistoricalRates() {
    let outHTML = `<h4>Choose date: </h4>
                    <input  class="form-control" 
                                  type="date" 
                                  id="calendar2" 
                                  min="1999-01-02"
                                  max=${moment(new Date()).format("YYYY-MM-DD")}>`;
    return outHTML;
  }

  createHistoricalList() {
    const tags = `Foreign exchange rates for 
                  <strong>
                    ${this.date}
                  </strong> 
                  by base currency: 
                  <strong>
                    ${this.data.base}
                  </strong>`;
    this.historicalList = $('<div/>', {
      class: "historical-list"
    }).appendTo(this.tabHistorical);
    $('<h5/>', {
      html: tags
    }).appendTo(this.historicalList);
    $('<h5/>', {
      html: `Rates of 1 ${this.data.base}:</strong>`
    }).appendTo(this.historicalList);
    for (let key in this.data.rates) {
      $('<p/>', {
        html: `<strong>${this.data.rates[key]}</strong> ${key}`
      }).appendTo(this.historicalList);
    }
  }

  createFormInline(currency, dataSet) {
    const divForm = $('<div/>', {
      class: "form-inline row"
    });
    const inputText = $('<input/>', {
      class: "form-control control col-md-6",
      type: "text",
      value: 100
    }).appendTo(divForm);
    inputText.attr("data-text", dataSet);
    const select = $('<select/>', {
      class: "form-control control col-md-5",
      type: "text"
    }).appendTo(divForm);
    select.attr("data-text", dataSet);
    this.createOptions(select, currency);
    return  divForm[0].outerHTML;
  }

  createOptions(tag, currency) {
    this.currenciesList.forEach(item => {
      tag.append(`<option>${item}</option>`);
    });
    const findDefaultCurrency = this.currenciesList.indexOf(currency);
    tag[0][findDefaultCurrency].defaultSelected = true;
  }

  courseCalculation(tag) {
    const inputs = $(".control");
    let baseValue,
      baseCur,
      baseRate,
      resultValue,
      resultCur,
      resultRate,
      resultInput;
    if(tag.nodeName === "INPUT") {
      baseValue = tag.value;
      if(tag.dataset.text === "firstCur") {
        baseCur = inputs[1].value;
        resultInput = inputs[2];
        resultCur = inputs[3].value;
      }
      if(tag.dataset.text === "secondCur") {
        baseCur = inputs[3].value;
        resultInput = inputs[0];
        resultCur = inputs[1].value;
      }
    }
    if(tag.nodeName === "SELECT") {
      baseCur = tag.value;
      if(tag.dataset.text === "firstCur") {
        baseValue = +inputs[0].value;
        resultInput = inputs[2];
        resultCur = inputs[3].value;
      }
      if(tag.dataset.text === "secondCur") {
        baseValue = +inputs[2].value;
        resultInput = inputs[0];
        resultCur = inputs[1].value;
      }
    }
    baseRate = baseCur === "EUR" ? 1 : this.data.rates[baseCur];
    resultRate = resultCur === "EUR" ? 1 : this.data.rates[resultCur];
    resultValue = baseValue/(baseRate/resultRate);
    resultInput.value = resultValue.toFixed(2);
    const tagShowResult = $(".show-result");
    if(tagShowResult.length === 0) {
      this.showResult({
        baseValue,
        baseCur,
        baseRate,
        resultValue,
        resultCur,
        resultRate
      })
    } else {
      tagShowResult.remove();
      this.showResult({
        baseValue,
        baseCur,
        baseRate,
        resultValue,
        resultCur,
        resultRate
      });
    }
  }

  setInLocaleStorage(date, rates) {
    localStorage.setItem(this.date, JSON.stringify(rates));
  }

  showResult(obj) {
    const resultValue = +obj.resultValue.toFixed(2);
    const baseValue = Math.round(obj.baseValue*100)/100;
    const tags = `<p>Foreign exchange rates for 
                    <strong>
                      ${this.date}
                    </strong> 
                    are: 
                  </p>
                  <p>
                    <strong>
                      ${baseValue} ${obj.baseCur}
                    </strong> 
                    cost 
                    <strong>
                      ${resultValue} ${obj.resultCur}
                    </strong>
                  </p>`;
    $("<div/>", {
      class: "alert alert-primary show-result",
      html: tags
    }).appendTo(this.tabCalculator)
  }

  showSpinner() {
    return `<div class="spinner-border" role="status">
                      <span class="sr-only">Loading...</span>
                    </div>`
  }

  destroySpinner() {
    $(".spinner-border").remove();
  }
}

const rates = new ForeignExchangeRates();
rates.init();
