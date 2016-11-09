/**
* @api {get} / API Status
* @apiGroup Status
* @apiSuccess {String} status Status da API
* @apiSuccessExample {json} Sucesso
*   HTTP/1.1 200 OK
*   {"status": "online"}
*/
module.exports = app => {
  app.get('/', (req, res) => {
    res.json({status: "online"});
  });
};