import connection from "../database/db.js";
import { nanoid } from 'nanoid';

async function shortenUrl(req, res) {
    const { url } = req.body;
    const shortUrl = nanoid(10);
    const userId = res.locals.userId;
    const isValidUrl = urlString => {
        var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
      '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    return !!urlPattern.test(urlString);
  }
    const valid = isValidUrl(url);
    if(!valid){
        return sendStatus(422);
    }
    try {
        await connection.query(`
            INSERT INTO urls
            (url, shortUrl, userId)  
            VALUES
            ($1, $2, $3);`,
            [url, shortUrl, userId]
        );
        res.status(201).send(shortUrl);
    } catch (error) {
        return error;
    }
}

async function getUrlsById(req, res){
    const { id, url, shorturl } = res.locals.urlObject;
    return res.send({ id, shorturl, url });
}

async function openShortUrl(req, res){
    const { visitcount, url } = res.locals.urlObj;
    let newVisitCount = visitcount + 1;
    await connection.query(`UPDATE urls SET visitcount = $1 WHERE url = $2;`, [newVisitCount, url]);
    res.redirect(url)
    return;
}

async function deleteUrl(req, res){
    const { id } = req.params;
    const userId = res.locals.userId;
    try {
        const urlValidation = await connection.query(`
        SELECT id FROM urls WHERE id = $1;`, [id]);
        if(!urlValidation){
            return res.sendStatus(404);
        }
        const url = await (await connection.query(`SELECT id FROM urls WHERE id = $1 AND userId = $2`, [id, userId])).rows[0];
        if(!url){ return res.sendStatus(401)}
        await connection.query(`DELETE FROM urls WHERE id = $1`, [id]);
        return res.sendStatus(204);
        
    } catch (error) {
        return res.sendStatus(500);        
    }
}

export {
    shortenUrl,
    getUrlsById,
    openShortUrl,
    deleteUrl
}