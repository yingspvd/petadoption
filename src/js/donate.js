App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Donate.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var DonateArtifact = data;
      App.contracts.Donate = TruffleContract(DonateArtifact);
      App.contracts.Donate.setProvider(App.web3Provider);
      App.getMyDonate();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", ".btn-donate", App.handleDonate);
  },

  handleDonate: function (event) {
    event.preventDefault();
    var eth_value = document.getElementById("donate_value").value;
    var eth_value_wei = web3.toWei(eth_value, "ether");

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Donate.deployed()
        .then(function (instance) {
          donateInstance = instance;

          return donateInstance.donate(eth_value_wei, {
            from: account,
            value: eth_value_wei,
          });
        })
        .then(function (result) {
          alert("Thanks for your donation amount " + eth_value + " ETH");
          document.getElementById("donate_value").value = "";
          App.getMyDonate();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },

  getMyDonate: function (event) {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Donate.deployed()
        .then(function (instance) {
          donateInstance = instance;
          return donateInstance.getDonations({
            from: account,
          });
        })
        .then((resp) => {
          const mydonate = web3.fromWei(resp.toString(), "ether");
          document.getElementById("donate_stat_value").innerHTML = mydonate;
        })

        .catch(function (err) {
          console.log(err.message);
        });
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
