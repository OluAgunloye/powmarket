const log = require("debug")("pow:server");

import express from "express"

import bsv from "bsv"

import compression from "compression"
import mustacheExpress from "mustache-express"
import bodyParser from "body-parser"
import * as timeago from "timeago.js"

import { connect } from "./db"
import * as helpers from "./helpers"

export async function start(port=8000) {

    const app = express();

    app.use(express.static(__dirname + "/../public"))
    app.use(compression());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.engine('html', mustacheExpress());
    app.set('view engine', 'html');
    app.set('views', __dirname + '/../views');

    app.get('*', async function(req, res) {
        const bsvusd = await helpers.backup_bsvusd();

        const db = await connect();

        const magicnumbers = await db.collection("magicnumbers").find().toArray();

        const numtxs = magicnumbers.length;
        const mined = magicnumbers.filter(m => { return m.mined }).map(m => {
            m.display_date = timeago.format(m.created_at * 1000);
            m.display_value = helpers.satoshisToDollars(m.value, bsvusd);
            return m;
        }).sort((a, b) => {
            if (a.created_at > b.created_at) { return -1 }
            if (a.created_at < b.created_at) { return 1 }
            return 0;
        });
        const unmined = magicnumbers.filter(m => { return !m.mined }).map(m => {
            m.display_date = timeago.format(m.created_at * 1000);
            m.display_value = helpers.satoshisToDollars(m.value, bsvusd);
            if (m.magicnumber.length > 10) {
                m.magicnumber = m.magicnumber.substring(0, 10) + "...";
            }
            return m;
        }).sort((a, b) => {
            if (a.created_at > b.created_at) { return -1 }
            if (a.created_at < b.created_at) { return 1 }
            return 0;
        });

        res.render('index', { mined, unmined, numtxs, bsvusd });
    });

    log(`starting server at http://localhost:${port}`);

    return app.listen(port);
}


start();