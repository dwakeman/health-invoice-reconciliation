/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class HealthInvoiceReconciliation extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        console.info('============= END : Initialize Ledger ===========');
    }

    async createInvoice(ctx,invoiceNo, invoiceName, invoiceDate, lob, quantity, price){
        console.info('============= START : Create Invoice ===========');

        // check to see if an invoice with the same invoiceNo already exists
        const invoiceAsBytes = await ctx.stub.getState(invoiceNo); // get the invoice from chaincode state
        console.log("The invoice returned is " + invoiceAsBytes.toString());
        console.log("the length of invoiceAsBytes is " + invoiceAsBytes.length);

        if (invoiceAsBytes.length != 0) {
//            throw new Error(`${invoiceNo} already exists`);
            return "Error: invoice " + invoiceNo + " already exists";
        } else {
            const invoice = {
                invoiceNo,
                docType: 'invoice',
                invoiceName,
                invoiceDate,
                lob,
                quantity,
                price,
                status:'Pending',
                message:'Please approve',
            };
            await ctx.stub.putState(invoiceNo, Buffer.from(JSON.stringify(invoice)));
            console.info('============= END : Create Invoice ===========');
            return "invoice " + invoiceNo + " created";

        }




    }

    async approveInvoice(ctx,invoiceNo){
        console.info('============= START : approveInvoice ===========');
        const invoiceAsBytes = await ctx.stub.getState(invoiceNo); // get the invoice from chaincode state
        if (!invoiceAsBytes || invoiceAsBytes.length === 0) {
            throw new Error(`${invoiceNo} does not exist`);
        }
        console.log(invoiceAsBytes.toString());
        const invoice = JSON.parse(invoiceAsBytes.toString());
        invoice.status = 'Approved';
        invoice.message = 'The invoice has been approved';

        await ctx.stub.putState(invoiceNo, Buffer.from(JSON.stringify(invoice)));
        console.info('============= END : approveInvoice ===========');

    }

    async disputeInvoice(ctx,invoiceNo, message){
        console.info('============= START : disputeInvoice ===========');
        const invoiceAsBytes = await ctx.stub.getState(invoiceNo); // get the invoice from chaincode state
        if (!invoiceAsBytes || invoiceAsBytes.length === 0) {
            throw new Error(`${invoiceNo} does not exist`);
        }
        console.log(invoiceAsBytes.toString());
        const invoice = JSON.parse(invoiceAsBytes.toString());
        invoice.status = 'Not Approved';
        invoice.message = message;


        await ctx.stub.putState(invoiceNo, Buffer.from(JSON.stringify(invoice)));
        console.info('============= END : disputeInvoice ===========');

    }


    async getOpenInvoices(ctx){
        console.info('============= START : getOpenInvoices ===========');
        const queryString = {
            "selector": {
                "status": "Pending"
            }
        }

//        const queryString = {};

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allOpenInvoices = [];
        while (true) {
            const openInvoice = await iterator.next();
            if (openInvoice.value && openInvoice.value.value.toString()) {
                console.log(openInvoice.value.value.toString('utf8'));

                const Key = openInvoice.value.key;
                let Record;
                try {
                    Record = JSON.parse(openInvoice.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = openInvoice.value.value.toString('utf8');
                }
//                allOpenInvoices.push({ Key, Record });
                allOpenInvoices.push(Record);
            }
            if (openInvoice.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allOpenInvoices);
                return allOpenInvoices;
            }
        }


    }



    async getInvoice(ctx, invoiceNo) {

        const invoiceAsBytes = await ctx.stub.getState(invoiceNo); // get the invoice from chaincode state

        if (!invoiceAsBytes || invoiceAsBytes.length === 0) {

            throw new Error(`${invoiceNo} does not exist`);

        }

        console.log(invoiceAsBytes.toString());

        return JSON.parse(invoiceAsBytes.toString());

    }



    async getInvoices(ctx, status) {

        console.info('============= START : getOpenInvoices ===========');
        let queryString;

        if(status ='ALL'){
            queryString = {
                "selector": {}
            }
        } else {
            queryString = {
                "selector": {
                    "status": status
                }
            }
        }


        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        const allOpenInvoices = [];

        while (true) {
            const openInvoice = await iterator.next();
            if (openInvoice.value && openInvoice.value.value.toString()) {
                console.log(openInvoice.value.value.toString('utf8'));

                const Key = openInvoice.value.key;

                let Record;

                try {
                    Record = JSON.parse(openInvoice.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = openInvoice.value.value.toString('utf8');
                }

//                allOpenInvoices.push({ Key, Record });
                allOpenInvoices.push(Record);
            }

            if (openInvoice.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allOpenInvoices);
//                return JSON.stringify(allOpenInvoices);
                return allOpenInvoices;
            }
        }
    }

    async getInvoiceHistory(ctx, invoiceNo) {

        console.info('============= START : getInvoiceHistory ===========');
        let iterator = await ctx.stub.getHistoryForKey(invoiceNo);

        let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));
                jsonRes.tx_id = res.value.tx_id;
                jsonRes.timestamp = new Date(res.value.timestamp.seconds.low * 1000).toISOString();
                jsonRes.is_delete = res.value.is_delete;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                console.info('============= END : getInvoiceHistory ===========');
                return allResults;
            }
        }
    }
}
module.exports = HealthInvoiceReconciliation;
