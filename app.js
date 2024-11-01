require('dotenv').config()
const axios = require('axios');
const qs = require('qs');
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

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

    return res.data.access_token;
}

const getFleetOrders = async (token) => {

    let now = Date.now() / 1000;
    let body = {
        "offset": 0,
        "limit": 1000,
        "company_ids": [
            48247
        ],
        "start_ts": now - (7 * 24 * 60 * 60), /* 7 dni */
        "end_ts": now
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

    return res.data.data.orders;
}

function convertDriversPricesToCSV(driversPrices) {
    const headers = ["driver_name", ...Object.keys(Object.values(driversPrices)[0])];

    let csvContent = headers.join(",") + "\n";

    for (const [driverName, data] of Object.entries(driversPrices)) {
        const row = [driverName, ...Object.values(data)];
        csvContent += row.join(",") + "\n";
    }

    const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
    const fileName = `drivers_payouts_report_${today}.csv`;
    const filePath = path.join(__dirname, 'raports', fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, csvContent);

    return [filePath, fileName]
}

const sendRaport = async (data) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'kitlasdamian@gmail.com',
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    let [ attachment_filepath, attachment_filename ] = convertDriversPricesToCSV(data);

    const mailOptions = {
        from: 'kitlasdamian@gmail.com',
        to: 'kitlasdamian@gmail.com',
        subject: 'Raport tygodniowy pracowników',
        text: JSON.stringify(data),
        attachments: [
            {
                filename: attachment_filename,
                path: attachment_filepath
            }
        ]
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
    let orders = await getFleetOrders(token)

    let drivers_prices = {};

    orders.forEach((order) => {
        if (!drivers_prices[order.driver_name]) {
            drivers_prices[order.driver_name] = {
                booking_fee: 0,
                cancellation_fee: 0,
                cash_discount: 0,
                net_earnings: 0,
                tip: 0,
                commission: 0,
                in_app_discount: 0,
                toll_fee: 0,
                ride_price: 0,
                cash: 0
            };
        }

        drivers_prices[order.driver_name].booking_fee      += order.order_price.booking_fee;
        drivers_prices[order.driver_name].cancellation_fee += order.order_price.cancellation_fee;
        drivers_prices[order.driver_name].cash_discount    += order.order_price.cash_discount;
        drivers_prices[order.driver_name].net_earnings     += order.order_price.net_earnings;
        drivers_prices[order.driver_name].tip              += order.order_price.tip;
        drivers_prices[order.driver_name].commission       += order.order_price.commission;
        drivers_prices[order.driver_name].in_app_discount  += order.order_price.in_app_discount;
        drivers_prices[order.driver_name].toll_fee         += order.order_price.toll_fee;
        drivers_prices[order.driver_name].ride_price       += order.order_price.ride_price;

        if(order.payment_method == "cash"){
            drivers_prices[order.driver_name].cash       += order.order_price.ride_price;

        }
    })

    let tax_per_driver = 6.77

    for(let driver_name in drivers_prices){
        drivers_prices[driver_name].net_earnings_with_fee = drivers_prices[driver_name].net_earnings - tax_per_driver;
        drivers_prices[driver_name].cash_in_hand = drivers_prices[driver_name].cash - drivers_prices[driver_name].cash_discount;
        drivers_prices[driver_name].payouts = drivers_prices[driver_name].net_earnings_with_fee - drivers_prices[driver_name].cash_in_hand;
        drivers_prices[driver_name].worker_payout = drivers_prices[driver_name].payouts - drivers_prices[driver_name].ride_price * 0.08 - 30;
    }

    await sendRaport(drivers_prices);
})();
