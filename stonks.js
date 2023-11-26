const fetch = (...args) =>
    import('node-fetch').then(({default: fetch}) => fetch(...args));

const express = require('express')
const app = express()

const EXCHANGE_API_KEY = '75168ce32ac949669c24a2c96fbc860c'
const CONVERTER_API_KEY = 'cur_live_mLaJWjZZEUMIqAgoGuBw29V0jeg1YvJW1EYHxgaT&currencies'

const port = 6969

app.get('/data', async (req, res) => {
    try {
        const {ticket, startDate, endDate, interval} = req.query;

        const url = `/time_series?apikey=${EXCHANGE_API_KEY}&interval=${interval}&symbol=${ticket}&timezone=Europe/Moscow&format=JSON&start_date=${startDate}&end_date=${endDate}`
        const exchangeRes = await fetch('https://api.twelvedata.com' + url);

        if(exchangeRes.status > 400){
            res.status(502).send('Sorry, exchange API is not working now');
            return
        }

        const data = await exchangeRes.json();

        if (data.values) {
            res.json(data.values);
        } else {
            res.status(400).send(data.message)
        }
    } catch (e){
        res.status(500).send('Something went wrong')
        console.log(e)
    }
})

app.get('/advice', async (req, res) => {
    //the most useful & complicated AI-based financial adviser ever made
    //use it only if your goal is to become poor

    try {
        const {ticket} = req.query;

        const supercomputerDecision = Math.floor((Math.random() * 3)) % 3;
        let advice = '';

        switch (supercomputerDecision) {
            case 0:
                advice = 'sell';
                break;
            case 1:
                advice = 'hold';
                break;
            case 2:
                advice = 'buy';
                break;
        }

        res.json({
            ticket: ticket,
            advice: advice,
            text: `We recommend you to ${advice} $${ticket}`
        })
    } catch (e){
        res.status(500).send('Something went wrong')
        console.log(e)
    }
})

app.get('/convert', async (req, res) => {
    try {
        const {ticket, targetCurrency} = req.query;
        const exchangeRes = await fetch(
            `https://api.twelvedata.com/time_series?apikey=${EXCHANGE_API_KEY}&interval=1min&symbol=${ticket}&outputsize=1&format=JSON`
        );
        if(exchangeRes.status === 404){
            res.status(400).send('Could not find such ticket');
            return
        }

        if(exchangeRes.status > 400){
            res.status(502).send('Sorry, exchange API is not working now');
            return
        }

        const exchangeJSON = await exchangeRes.json();
        const exchangeCurrency = exchangeJSON.meta.currency;
        const exchangePrice = exchangeJSON.values[0].open;

        const converterRes = await fetch(
            `https://api.currencyapi.com/v3/latest?apikey=${CONVERTER_API_KEY}&currencies=${targetCurrency}&base_currency=${exchangeCurrency}`
        );

        if(converterRes.status === 422){
            res.status(400).send('The targetCurrency is not supported yet');
            return
        }

        if(converterRes.status > 400){
            res.status(502).send('Sorry, converter API is not working now');
            return
        }


        const converterResJSON = await converterRes.json();
        const course = converterResJSON.data[targetCurrency].value;

        res.json({
            ticket: ticket,
            exchange: {
                currency: exchangeCurrency,
                value: exchangePrice
            },
            converted: {
                currency: targetCurrency,
                value: exchangePrice * course
            },
            course: course
        })
    } catch (e){
        res.status(500).send('Something went wrong')
        console.log(e)
    }
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})