// アドオンのアクションボタンが押された時、タブを引数として実行
chrome.action.onClicked.addListener(async (tab) => {
    chrome.tabs.sendMessage(
        tab.id,
        {
            name: "getImgUrls" // imgタグのsrcのリストをくれ
        }
    );
    return true;
});

// 抽出したimg srcの配列をメッセージで受け取って処理する
chrome.runtime.onMessage.addListener(
    async (req, opt) => {
        if (req.name === 'resImgUrls') {
            //console.log(`resImgUrls is working. ${req.data}`);
            let blobArray = [];
            const reader = new FileReader();
            reader.onload = () => {
                blobArray.push(reader.result);
            }
            for (let i = 0, max = req.data.length; i < max; i++) {
                const data = await fetch(req.data[i]);
                const ctype = data.headers.get('content-type');
                //console.log(`ok: ${data.ok}, type: ${data.type}, ctype: ${ctype}`);
                const blob = await data.blob();
                reader.readAsDataURL(blob);
            }
            // content-scriptにData URIの配列を送り返す
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        name: "resBlobArray",
                        data: blobArray
                    }
                );
            });
        }
        return true;
    }
)
