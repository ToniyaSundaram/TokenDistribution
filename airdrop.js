var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
var net = require('net');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/qe93eRW1ZLx44WsdN2wh'),net);//'https://mainnet.infura.io/{{TOKEN}}'


var Tx = require('ethereumjs-tx');
var startTime;
var endTime;
// Reading from csv File and push into transferAddress array
let allocData = new Array(); 
let sentLogs = new Array();

let ENOUGH_TOKEN = "Don't have enough token to make this transaction";
let ENOUGH_ETHER = "Don't have enough ether to make this transaction";

var contractAddress = '0x135a109495eb9881ee83b1bbb4f9cd4d82ef37ca';
var contractABI = [ { "anonymous": false, "inputs": [ { "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "approve", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_subtractedValue", "type": "uint256" } ], "name": "decreaseApproval", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_addedValue", "type": "uint256" } ], "name": "increaseApproval", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transfer", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "name": "name", "type": "string" }, { "name": "symbol", "type": "string" }, { "name": "decimals", "type": "uint8" }, { "name": "totalSupply", "type": "uint256" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" } ], "name": "allowance", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "name": "balance", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [ { "name": "", "type": "uint8" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "name", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" } ];
var contractObj = new web3.eth.Contract(contractABI, contractAddress);


const address = '0xA11aa1b423aF22Dfc6459f9Db725c83b69cC4068';
const privateKey = '82cd6da637828356a76e8eb1f3e0b0746757dda8414e845b208cd8d86e1d59bd';

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
    endTime = Date.now()
    var elapsed = (endTime-startTime)/1000;
    console.log("It took "+elapsed+" seconds to complete");
    writeMe();
    
}

async function transferToken(walletAddress, amount) {
    return new Promise(async(resolve, reject) => {
        try {
            
            var balance = await contractObj.methods.balanceOf(address).call();
            console.log("=======balance",balance)
            //var finalToken = web3.utils.toWei(amount, 'ether');
            var finalToken = amount;
            if (+balance < +finalToken) {
                resolve([null, ENOUGH_TOKEN]);
            } else {
                let sentObject = {}
                var data = contractObj.methods.transfer(walletAddress, finalToken).encodeABI();
                signTransaction(data, resolve, reject).then(function(){
                     sentObject['address'] = walletAddress;
                     sentObject['token'] = amount;
                     sentLogs.push(sentObject);
                })

            }
        } catch (e) {
            reject(e);
        }
    })
}

async function signTransaction(functionData, resolve, reject) {
    try {
        var gasObj = {
            to: contractAddress,
            from: address,
            data: functionData
        };

        var nonce;
        var gasPrice;
        var gasEstimate;
        var balance;
        try {
            nonce = await web3.eth.getTransactionCount(address);
            gasPrice = await web3.eth.getGasPrice();
            gasEstimate = await web3.eth.estimateGas(gasObj);
            balance = await web3.eth.getBalance(address);
        } catch (e) {
            console.log(e);
        }
        if (+balance < (+gasEstimate * +gasPrice)) {
            resolve([null, ENOUGH_ETHER]);
        } else {
            var tx = new Tx({
                to: contractAddress,
                nonce: +nonce,
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: web3.utils.toHex(gasEstimate),
                data: functionData
            });
            tx.sign(new Buffer(privateKey, 'hex'));
            web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'))
                .on('transactionHash', function (hash) {
                    console.log(hash);
                })
                .on('receipt', function (receipt) {
                    resolve([receipt]);
                })
                .on('confirmation', function (confirmationNumber, receipt) {

                })
                .on('error', function (error) {
                    try {
                        console.log(error);
                        var data = error.message.split(':\n', 2);
                        if (data.length == 2) {
                            var transaction = JSON.parse(data[1]);
                            transaction.messesge = data[0];
                            return resolve([transaction]);
                        }
                        reject(error);
                    } catch (e) {
                        reject(e);
                    }
                });
        }
    } catch (e) {
        reject(e);
    }
}

web3.eth.net.isListening(function (err, res) {
    if (err)
        console.log(err)
    else
        init();
});



let amount = '10';
async function init() {
    try {
        console.log('Started')
        startTime = Date.now()
        readFile()
        .then((allocData) => {
            asyncForEach(allocData, async(each) => {
                let [data,err] = await transferToken(each.address,each.token);
                if (err) {
                    console.error("Error", err);
                } else {
                    console.log("Success", data);
                }
            });
        });
         
     }catch (e) {
        console.error(e);
    }
        
}


let count = 0;
function readFile() {
  return new Promise((resolve, reject) => {
    var stream = fs.createReadStream("distribute.csv");
    var csvStream = csv()
    .on("data", function(data){
    
      if(count > 0) {          
      let mapObject = {};
      let isAddress = web3.utils.isAddress(data[0]);
          if(isAddress && data[0]!=null && data[0]!='' ){
            console.log(data[0]);

            data[1] = parseInt(data[1]);
            if(data[1]!='' && data[1]!=null && data[1]>0){
                    console.log(data[1]);            
                    mapObject['address'] = data[0];
                    mapObject['token'] = data[1];
                    allocData.push(mapObject);
             }
          }
        }
        count++;
    })
    .on("end", function(){
         console.log("done");
         console.log(allocData)
        // printFile();
         resolve(allocData);
    });
 
    stream.pipe(csvStream);
  });

}

console.log(`
--------------------------------------------
------------- Parsing csv file -------------
--------------------------------------------
******** Removing beneficiaries without tokens or address data
--------------------------------------------
-------------------------------------------
`);


///Writing the array into a csv file 
var csvWriter = require('csv-write-stream')
var writer = csvWriter({ headers: ["address","token"]})
writer.pipe(fs.createWriteStream('log.csv'))

function writeMe(){
    console.log("sentLogs.length",sentLogs.length)
    sentLogs.forEach(function (arrayItem) {
        writer.write({address: arrayItem.address,token:arrayItem.token})
  });
  writer.end() 
}