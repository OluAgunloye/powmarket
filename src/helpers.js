const log = require("debug")("pow:helpers");

export function satoshisToDollars(satoshis, bsvprice) {
    if (satoshis < 0) {
        return null;
    }

    if ((!bsvprice && bsvprice !== 0) || isNaN(bsvprice) || bsvprice < 0) {
        return null;
    }

    var val = ((satoshis / 100000000.0) * bsvprice).toLocaleString("en-US", {'minimumFractionDigits':2, 'maximumFractionDigits':2});

    if (val == "0.00" || val == "0.01") {
        val = ((satoshis / 100000000.0) * bsvprice).toLocaleString("en-US", {'minimumFractionDigits':3, 'maximumFractionDigits':3});

        // ends in 0
        if (val.length == 5 && val[4] == "0") {
            val = val.slice(0, 4);
        }
    }

    if (isNaN(val) && isNaN(val.replace(",", ""))) {
        return null;
    }

    return val;
}

let cryptocompare_price_timeout = 0;
let cryptocompare_expire = 60 * 5; // 5 minute cache
let cryptocompare_price = null;

export async function backup_bsvusd() {

    return new Promise((resolve, reject) => {

        const now = Math.floor(Date.now() / 1000);
        const diff = now - cryptocompare_price_timeout;
        if (diff >= cryptocompare_expire) {
            log(`cache busting backup bsvusd price`);
            cryptocompare_price_timeout = now;
        } else {
            if (cryptocompare_price !== null) {
                log(`using cached BSVUSD price of ${cryptocompare_price} from cryptocompare API for ${cryptocompare_expire - diff} more seconds`);
                resolve(cryptocompare_price);
                return;
            }
        }

        const url = "https://min-api.cryptocompare.com/data/price?fsym=BSV&tsyms=USD&api_key=d78f5c433def7aae505eb702a4040508a5741f612e8038e5581c8302054a2f15";

        const https = require('https');

        https.get(url, (resp) => {
            log(`live hitting cryptocompare API for bsvusd price`);

            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try {
                    const obj = JSON.parse(data);
                    if (!obj || !obj.USD) {
                        throw new Error(`invalid bsvusd price data object from cryptocompare ${data}`);
                    }

                    const num = Number(obj.USD);
                    if (isNaN(num)) {
                        throw new Error(`invalid bsvusd price data returned from cryptocompare ${num}`);
                    }

                    log(`fetched BSVUSD price ${num} from cryptocompare API`);
                    cryptocompare_price = num;

                    resolve(num);
                } catch (e) {
                    reject(`error while parsing cryptocompare price data ${e.message}`);
                }
            });

        }).on("error", (err) => {
            reject(`error while fetching cryptocompare price data ${err.message}`);
        });
    });
}

export async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function stripid(results) {
    return results.map(result => {
        delete result["_id"];
        return result;
    });
}
