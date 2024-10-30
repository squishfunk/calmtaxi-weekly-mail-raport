require('dotenv').config()
const axios = require('axios');
const qs = require('qs');
const nodemailer = require("nodemailer");

const getAuthToken = async () => {
    const res = await axios.post('https://oidc.bolt.eu/token',
        qs.stringify({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'fleet-integration:api'
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    )

    console.log(res.data);
    return res.data.access_token;
}

const getFleetOrders = async (token) => {
    let body = {
        "offset": 0,
        "limit": 1000,
        "company_ids": [
            48247
        ],
        "start_ts": 1729461600, /* 7 dni */
        "end_ts": 1730070000
        // "start_ts": now - (7 * 24 * 60 * 60), /* 7 dni */
        // "end_ts": now
    }

    const res = await axios.post(
        'https://node.bolt.eu/fleet-integration-gateway/fleetIntegration/v1/getFleetOrders',
        body,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }
    )
    console.log(res.data);
    return res.data.data.orders;
}

const sendRaport = async (data) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'kitlasdamian@gmail.com',
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: 'kitlasdamian@gmail.com',
        to: 'kitlasdamian@gmail.com',
        subject: 'Raport tygodniowy pracowników',
        text: JSON.stringify(data),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail wysłany: ' + info.response);
    } catch (error) {
        console.error('Błąd przy wysyłaniu e-maila:', error);
    }
}

(async ()=>{

    let token = await getAuthToken();
    console.log('token', token);

    let orders = await getFleetOrders(token)

    let drivers_prices = {};

    orders.forEach((order) => {
        if (!drivers_prices[order.driver_name]) {
            drivers_prices[order.driver_name] = 0;
        }

        console.log(order);

        // let sumAll = 0;
        //
        // for (let order_price_element in order.order_price){
        //     sumAll += order.order_price[order_price_element];
        // }

        drivers_prices[order.driver_name] += order.order_price.net_earnings;
    })

    console.log(drivers_prices);
    await sendRaport(drivers_prices);
})();
