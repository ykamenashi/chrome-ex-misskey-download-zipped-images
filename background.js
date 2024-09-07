// アドオンのアクションボタンが押された時、タブを引数として実行
chrome.action.onClicked.addListener( async (tab)=>{
    const src_jszip = chrome.runtime.getURL('lib/jszip.js');
    const src_FileSaver = chrome.runtime.getURL('lib/FileSaver.js');
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: injectedFunc,
        args: [src_jszip, src_FileSaver]
    });
});

const injectedFunc = (src_jszip, src_FileSaver)=>{
    const toukoubi = new Date(document.querySelector('footer a time').title).toLocaleString(
        'ja-JP',{
            year:   'numeric',
            month:  "2-digit",
            day:    "2-digit",
            hour:   "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).replace(/\//g,'-').replace(/:/g,'').replace(/ /,'_');
    const user_id = document.querySelectorAll('article header a')[0].href.split('@')[1];
    //const img_list = Array.from(document.querySelectorAll('.image .chromatic-ignore img')).map(({src}) => src);
    const img_tag_list = document.querySelectorAll('.image .chromatic-ignore img');
    const canvas_list = document.querySelectorAll('.image .chromatic-ignore canvas');
    /*
    window.alert(
        `投稿日: ${toukoubi}\n 作者: ${user_id}\n 画像: ${img_list.join('\n')}`
    );
    */
   (async () => {
        var zip = new JSZip();
        const cvs_ref = [];
        for( let i=0, max=canvas_list.length; i<max; i++){
            const img = img_tag_list[i];
            const cvs = canvas_list[i];
            cvs.getContext('2d').drawImage(img, 0, 0);
            cvs_ref.push(cvs);
        }
        Promise.all(cvs_ref.map(async (cvs)=>{
            return new Promise((resolve, reject)=>{
                cvs.toBlob((blob) =>{
                zip.file(cvs.title, blob);
                console.log(`${cvs.title}: ${blob}`);
                resolve();
                });
            });
        }))
        .then(()=>{
            zip.generateAsync({ type: 'blob' })
            .then( (content) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = `${user_id}_${toukoubi}.zip`;
                a.click();
            });
        });
   })();
}