chrome.runtime.onMessage.addListener(async (req, opt) => {
    // アクションボタンが押された時,img.srcのリストを送り返す
    if (req.name === 'getImgUrls') {
        //console.log('getImgUrls is working.');
        const img_src_list = Array.from(
            document.querySelectorAll('div.image a')
        ).map(({ href }) => href);
        chrome.runtime.sendMessage(
            {
                name: "resImgUrls",
                data: img_src_list
            }
        );
    } else if (req.name === 'resBlobArray') {
        // fetchしたBlobの配列を受け取ったら、zipファイルにしてダウンロードさせる
        //console.log(`resBlobArray is working. ${req.data}`);
        const blobs = req.data;
        //console.log(blobs); // Data URIの配列
        const zip = new JSZip();
        const canvas_list = document.querySelectorAll('.image .chromatic-ignore canvas');
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
        const toukoubi = new Date(document.querySelector('footer a time').title).toLocaleString(
            'ja-JP', {
            year: 'numeric',
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).replace(/\//g, '-').replace(/:/g, '').replace(/ /, '_');
        const user_id = document.querySelectorAll('article header a')[0].href.split('@')[1];
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