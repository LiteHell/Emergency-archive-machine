const phantom = require('phantom'),
      jsSHA = require('jssha'),
      express = require('express'),
      bodyParser = require('body-parser'),
      app = express(),
      fs = require('fs');

function hash(text) {
    let shaObj = new jsSHA("SHA-256", "TEXT");
    shaObj.update(text);
    return shaObj.getHash("HEX");
}
function render(url, ext, cb) {
    let fn = `archives/${hash(url)}-${Date.now()}.${ext}`;
    phantom.create().then((instance) => {
        instance.createPage().then((page) => {
            page.open(url).then((status) => {
                let success = status === 'success';
                if(!success) {
                    console.log(`failed : ${status}`);
                    cb(false);
                }
                page.render(fn).then(() => {
                    cb(true, fn);
                })
            })
        })
    });
}


app.use(bodyParser.urlencoded());
app.get('/', (req, res) => {
    res.status(200).end(`<html lang="ko"><head><meta charset="utf-8"><title>Emergency Lightweight Archvier - 긴급박제머신</title></head>
    <body><p>급히 만든 박제머신입니다. (This is Emergency Archiver)</p>
    <form action="/archive" method="POST">
    url : <input type="text" name="url"></input><br>
    <!-- <input type="checkbox" name="webcache" value="yes"></input> 구글 웹캐시를 박제(설명 : http://www.naver.com를 입력하고 이 항목 체크하면 http://www.naver.com의 구글 웹캐시를 박제함.)<br> -->
    확장자(Extension) : <input name="ext" value="pdf" type="radio"></input>PDF <input name="ext" value="png" type="radio"></input>PNG<br>
    <input type="submit" value="박제(Archive)"></input>
    </form></body></html>`);
});

app.post('/archive', (req, res) => {
    if(req.body.url && req.body.ext) {
        if(['pdf', 'png'].indexOf(req.body.ext) == -1)
            res.status(400).end('지원하지 않는 확장자입니다.');
        let url = req.body.url;
        /*if(req.body.webcache === "yes") {
            url = `http://cachedview.com/redirect.php?url=${encodeURIComponent(url)}&cache=Google`;
        }*/
        render(url, req.body.ext, (success, fn) => {
            let realPath = __dirname + '/' + fn;
            if(success && fs.existsSync(realPath)) {
                res.download(realPath, 'archive.' + req.body.ext);
            } else {
                res.status(500).end('오류가 발생했습니다.');
            }
        })
    } else {
        res.status(400).end();
    }
});

if(!fs.existsSync(__dirname + '/archives'))
    fs.mkdirSync(__dirname + '/archives')
app.listen(80, () => {
    console.log('working');
});