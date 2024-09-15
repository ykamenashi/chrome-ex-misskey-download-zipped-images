chrome.runtime.onMessage.addListener(async (req, opt) => {
    // アクションボタンが押された時,a.hrefのリストを送り返す
    if (req.name === 'getImgUrls') {
        //console.log('getImgUrls is working.');
        const img_src_list = Array.from(
            document.querySelectorAll('div.image a')
        ).map(({ href }) => href);
        chrome.runtime.sendMessage(
            {
                name: "resImgUrls",
                data: img_src_list,
                from: 'toolbar'
            }
        );
    } else if (req.name === 'resBlobArray') {
        // fetchしたBlobの配列を受け取ったら、zipファイルにしてダウンロードさせる
        //console.log(`resBlobArray is working. ${req.data}`);
        const blobs = req.data;
        //console.log(blobs); // Data URIの配列
        //console.log(`Blobs-length: ${blobs.length}`);
        const zip = new JSZip();

        // req.from の値で、操作元がツールバー or アンカーを分岐する
        let rootElm = {};
        if( req.from === 'toolbar'){
            rootElm = document;
        } else if (req.from === 'anchor') {
            rootElm = document.querySelectorAll('._shadow')[document.querySelectorAll('._shadow').length-1];
        } else {
            rootElm = document;
        }
        const canvas_list = rootElm.querySelectorAll('.image .chromatic-ignore canvas');
        const cvs_names = Array.from(canvas_list).map((cvs) => cvs.title);
        const tmp = [];
        // Promise.all()のために配列を準備する
        for (let i = 0, max = canvas_list.length; i < max; i++) {
            const res = await fetch(blobs[i]);
            const blob = await res.blob();
            tmp.push({
                name: cvs_names[i],
                blob: blob
            });
        }
        // ファイル名のために、投稿日と作者を取得
        const toukoubi = new Date(rootElm.querySelector('footer a time').title).toLocaleString(
            'ja-JP', {
            year: 'numeric',
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).replace(/\//g, '-').replace(/:/g, '').replace(/ /, '_');
        const user_id = rootElm.querySelectorAll('article header a')[0].href.split('@')[1];

        // zip.file() が非同期なので待つ
        Promise.all(tmp.map(async (data) => {
            return new Promise((resolve, reject) => {
                zip.file(data.name, data.blob, {binary: true});
                resolve();
            });
        }))
            .then(() => {
                zip.generateAsync({ type: 'blob' })
                    .then((content) => {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(content);
                        a.download = `${user_id}_${toukoubi}.zip`;
                        a.click();
                    });
            });
    }
    return true;
})

// setIntervalで、DOMを監視して、子ウインドウが開いていて、未処理なら、画像保存ボタンのリンクを埋め込む処理

const timer = setInterval(watchDOM, 500);

function watchDOM() {
    const windowElm = document.querySelectorAll('._shadow')[document.querySelectorAll('._shadow').length-1];
    if(windowElm.querySelectorAll('div.image a').length == 0) return; // ウインドウが無い場合、終了
    const toolbar = windowElm.querySelector('footer').firstChild; // footer DateTime link
    if( toolbar.childElementCount > 1 ) return; // ボタン埋め込み済の場合、終了
    let button = document.createElement('a'); // ダウンロードボタン
    button.innerText = '[まとめてダウンロード]';
    button.addEventListener('click', async (event) =>{
        const anchor = event.currentTarget;
        const article = anchor.parentElement.parentElement.parentElement;
        const imgURLList = article.querySelectorAll('div.image a');
        //alert(imgURLList.length);
        const img_src_list = Array.from(imgURLList).map(({ href }) => href);
        //console.log(img_src_list);
        chrome.runtime.sendMessage(
            {
                name: "resImgUrls",
                data: img_src_list,
                from: 'anchor'
            }
        );
    });
    toolbar.appendChild(button);
}
