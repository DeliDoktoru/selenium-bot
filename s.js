const axios = require('axios');
const https = require('https');
const fs = require('fs'); 
var webdriver = require("selenium-webdriver");
const { By} = require('selenium-webdriver');
var chrome = require("selenium-webdriver/chrome");
var jsdom = require('jsdom').JSDOM;
var chromeOptions = new chrome.Options();
setOptionsToDriver();
var driver ;
var urls=[];
var priorityUrls=[];
var obj={};
var currentObj;
var categorys=[];
async function run(u){
    //driver = new webdriver.Builder().forBrowser("chrome").setChromeOptions(chromeOptions).build();
    obj={};
    if(u==undefined || u==""){
        fs.appendFileSync("programming.txt", "link error");
        console.log("link error")
    }
    else{
        await openPage(u);
        if( u.indexOf("streamserie") != -1 ){
            await streamserie(await driver.getPageSource())
        }else if( u.indexOf("vostfree") != -1){
            await vostfree(await driver.getPageSource()) 
        }
        await sendData2(obj)
    }
    //await driver.quit()   
    fs.appendFileSync("programming.txt", "end of :"+u);
    console.log("end of :"+u)
}
async function waiter(url){
    if(await checkDDos1()){
        await new Promise(function(resolve, reject){
            setTimeout( function(){
                resolve();
            }, 1000);
        })
        await waiter(url)
    }else{
        if(await checkDDos2()){
            console.log("Attention Required!")
            fs.appendFileSync("programming.txt", "Attention Required!");
            await openPage(url)
        }
    }
    
}
async function openPage(url){
    await driver.get(url);
    if(await checkDDos2()){
        console.log("Attention Required!")
        fs.appendFileSync("programming.txt", "Attention Required!")
        await openPage(url)
    }
    else {
        await waiter(url)
    }
}
async function checkDDos1(){
    let l=await driver.getTitle()
    return l=="Just a moment..."?true:false;
}
async function checkDDos2(){
    let l=await driver.getTitle()
    return l=="Attention Required! | Cloudflare"?true:false;
}
function setOptionsToDriver(){
    chromeOptions.setUserPreferences({'useAutomationExtension':false})
    chromeOptions.setUserPreferences({'excludeSwitches':["enable-automation"]})
    chromeOptions.addArguments("--no-sandbox");
    chromeOptions.addArguments("--disable-dev-shm-usage");
    chromeOptions.addArguments("user-agent=Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36");
    chromeOptions.addArguments("--enable-javascript")
    chromeOptions.addArguments("--disable-blink-features=AutomationControlled")
    driver = new webdriver.Builder().forBrowser("chrome").setChromeOptions(chromeOptions).build();
}
async function streamserie(result){
    var document =new jsdom(result, {}); var window = document.window; var $ = require('jquery')(window); 
    obj.f={}
    obj.s={}
    obj.s.ekstra={}
    if(currentObj.id!=undefined){
        obj.f.name=$(".entry-title").eq(0).text().slice(11).replace(" en streaming","")
        obj.f.link=$(".entry-title").eq(0).text().slice(11).replace(" en streaming","").replaceAll(" ","-").replaceAll("&","")
        obj.f.year=$(".year").eq(0).text() 
        obj.f.cast=$("ul.cast-list>li").eq(1).text().replace("Acteurs\n","").replaceAll(" ,  ",", ") 
        obj.f.director=$("ul.cast-list>li").eq(0).text().replace("Réalisateur\n","").replaceAll(" ,  ",", ")
        obj.f.description=$(".entry-content>p").text()
        obj.s.ekstra.type=1
        obj.s.ekstra.categorys=[]
        obj.s.getHtmlLink=currentObj.link;
        for(let i=0;i<$(".genres>a").length;i++){
            for(x of categorys){
                if(x.txt==$(".genres>a").eq(i).text())
                    obj.s.ekstra.categorys.push({ categoryId:x.id })
            }
        }
        if(obj.s.ekstra.categorys[0]!=undefined){
            obj.f.category=obj.s.ekstra.categorys[0].categoryId
        }
    }
    obj.s.ekstra.sources=[]
    seasonlinks=[];
    for (adım = 0; adım < $("section.serie-info").find("nav>div").length; adım++) {
        if( !currentObj.season || currentObj.season<adım+2){
            seasonlinks.push( $("section.serie-info").find("nav>div").eq(adım).find("a").attr("href") )
        }
    }
    for(seasonlink of seasonlinks){
        let episodelinks=[];
        await openPage(seasonlink)
        var result=await driver.getPageSource();
        var document =new jsdom(result, {});  var window = document.window; var $ = require('jquery')(window); 
        for (adım = 0; adım < $("article.post.episode.post-epic").length; adım++) {
            if( !currentObj.bolum || currentObj.bolum<adım+1){
                episodelinks.push($("article.post.episode.post-epic").eq(adım).find("a").attr("href"))                
            }
        }
        var o=[];
        for(episodelink of episodelinks){
            await openPage(episodelink)
            var result=await driver.getPageSource();
            var document =new jsdom(result, {});  var window = document.window; var $ = require('jquery')(window); 
            a=$("h1.entry-title").text()
            s=parseInt(a.substring(a.indexOf("saison")+7,a.indexOf("episode")-1))
            e=parseInt(a.substring(a.indexOf("episode")+8,a.indexOf(" en streaming")))
            var tmp=[]
            for (let adım = 0; adım < $("aside.options>ul>li").length; adım++) {
                tmp.push({
                    language:$("aside.options>ul>li").eq(adım).find(".play>img").attr("alt"),
                    download:($("aside.options>ul>li").eq(adım).find(".dowicon>img").attr("alt")=="vostfr")?1:0,
                    source:$("aside.options>ul>li").eq(adım).text(),
                    sourcelink:$("aside.options>ul>li").eq(adım).attr("data-url") 
                })
            }
            o.push({
                bolumno: e,
                season:s ,
                bolumadi:"Episode "+e,
                kaynak:tmp
            })
        }
        obj.s.ekstra.sources.push(o)
    }
    if(currentObj.id!=undefined){
        obj.s.ekstra.linkImg=await getImdbImg(obj.f.name)
    }
    
}
async function vostfree(result){
    var document =new jsdom(result, {}); var window = document.window; var $ = require('jquery')(window); 
    obj.f={}
    obj.s={}
    obj.s.ekstra={}
    if(currentObj.id!=undefined){
        obj.f.name=$(".slide-middle>h1").text(); 
        obj.f.link=$(".slide-middle>h1").text().replaceAll(" ","-")
        obj.f.year=$(".slide-info").find("a").text()
        obj.f.cast=$(".slide-desc>.cast:contains('Acteur')").text().replaceAll("Acteur:","").replaceAll("\\.\\.\\.","").trim()
        obj.f.director=$(".slide-desc>.cast:contains('Réalisateur')").text().replaceAll("Réalisateur:","").replaceAll("\\.\\.\\.","").trim()
        $(".slide-desc>.cast").remove();
        obj.f.description=$(".slide-desc").text()
        obj.s.ekstra.type=3
        obj.s.ekstra.categorys=[]
        obj.s.getHtmlLink=currentObj.link;
        obj.s.ekstra.linkImg="https://vostfree.com"+$(".slide-poster>img").attr("src")
        var arr=$(".slide-middle>.slide-top").eq(1).text().replace("Genre:","").trim().split(",")
        for(let i=0;i<arr.length;i++){
            for(x of categorys){
                if(x.txt==arr[i].trim())
                    obj.s.ekstra.categorys.push({ categoryId:x.id })
            }
        }
        if(obj.s.ekstra.categorys[0]!=undefined){
            obj.f.category=obj.s.ekstra.categorys[0].categoryId
        }
    }
    obj.s.ekstra.sources=[]
    seasonlinks=[];
    seasonlinks.push(currentObj.link)
    for (adım = 0; adım < $(".new_player_series_count>a").length; adım++) {
            seasonlinks.push( $(".new_player_series_count>a").eq(adım).attr("href") )
        }
    for(seasonlink of seasonlinks){
        await openPage(seasonlink)
        var result=await driver.getPageSource();
        var document =new jsdom(result, {});  var window = document.window; var $ = require('jquery')(window); 
        a=parseInt($(".slide-middle>.slide-top").eq(0).find("li").eq(1).text().replace("Saison:","").trim()) 
        for (adım = 0; adım < $(".new_player_top").find("select>option").length; adım++) {
          if( !element.bolum || element.bolum<adım+1){
            var tmp=[]
            for(i=0; i< $("#buttons_"+(adım+1)).children().length;i++ ){
              l=$("#buttons_"+(adım+1)).children().eq(i).attr("id").split("_")[1]
              to="";
              ar=aSource($("#buttons_"+(adım)).children().eq(i),$)
              if(ar!="")
                to=ar.t+$("#content_player_"+l).text()+ar.z
              if(to!=""){
                tmp.push({
                    language:"vostfr",
                    download:0,
                    source:$("#buttons_"+(adım+1)).children().eq(i).text(),
                    sourcelink:to 
                })
              }
            }
            o.push({
                bolumno: adım+1,
                season:a ,
                bolumadi:"Episode "+adım+1,
                kaynak:tmp
            })
          }
        }
        
        
        
        
    }

}
async function getImdbImg(name){
    try{
    await openPage("https://www.imdb.com/find?q="+name+"&ref_=nv_sr_sm");
    var a=await driver.findElements(By.css("td.result_text"))
    var b=await a[0].findElement(By.css("a"))
    await b.click()
    return await driver.findElement(By.css("div.poster a img")).getAttribute("src") ;
    }
    catch(err){
        fs.appendFileSync("programming.txt", "Picture cant find"+JSON.stringify(currentObj))
        console.log("Picture cant find"+JSON.stringify(currentObj))
        return null;
    }
}
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
async function priorityTask(){
    if(priorityUrls.length==0){
        console.log("veri çek")
        getPriorityUrls()
    }
    await new Promise(function(resolve, reject){
        setTimeout( function(){
            priorityTask();
            resolve();
        }, 60000);
    })
   
}
async function task(){
    if(!categorys.length)
        await getCategorys()
    var selectedUrl=null;
    if(priorityUrls.length && currentObj!=undefined && currentObj.id!=undefined && priorityUrls[0].id==currentObj.id){
        priorityUrls.shift();
    }
    if(priorityUrls.length ){
        selectedUrl=priorityUrls[0].link.toString();
        currentObj=priorityUrls[0];
        priorityUrls.shift();
    }else{
        if(urls.length){
            selectedUrl=urls[0].getLink.toString();
            currentObj=urls[0];
            urls.shift();
        }
        else{
           await getUrls();
        }
    }
    if(selectedUrl){
        fs.appendFileSync("programming.txt", "start of :"+selectedUrl)
        console.log("start of :"+selectedUrl)
        await run(selectedUrl)
    }
    await new Promise(function(resolve, reject){
        setTimeout( function(){
            resolve();
        }, 1000);
    })
    await task()
}
async function sendData2(obj){
    axios.post('https://seriesgratuites.net/fr/xy',{
        "currentObj": currentObj,
        "data":obj
    } )
      .then(function (response) {
        fs.appendFileSync("programming.txt", response.data)
        console.log(response.data);
      })
      .catch(function (error) {
        fs.appendFileSync("programming.txt", "hata verdi")
          console.log("hata verdi")
           //console.log(error);
      });
}
function doRequest(url) {
    var options = {
        headers: {
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36",
        }
    };
    return new Promise ((resolve, reject) => {
      https.get(url,options, (resp) => {
        let html = '';
        resp.on('data', (chunk) => {
          html += chunk;
        });
        resp.on('end', () => {
            resolve(html);
        });
        }).on("error", (err) => {
            reject(err);
        });
    }); 
}
async function getPriorityUrls(){
    priorityUrls=JSON.parse(await doRequest("https://seriesgratuites.net/fr/nxlist"))
}
async function getUrls(){
    //urls=JSON.parse(await doRequest("https://seriesgratuites.net/fr/nylist"))
}
async function getCategorys(){
    let tmp=JSON.parse(await doRequest("https://seriesgratuites.net/fr/nclist"))
    for(x in tmp){
        categorys.push({id:tmp[x].id , txt:tmp[x].category });       
    }
}
function aSource(e){
    var t="",z="";
    if($(e).hasClass("new_player_mp4"))
      t="https://www.mp4upload.com/embed-"
    else if($(e).hasClass("new_player_uqload"))
      {t="https://uqload.com/embed-"; z=".html"}
    else if($(e).hasClass("new_player_vidfast"))
      t="http://vosmanga.tk/watch/"
    else if($(e).hasClass("new_player_verystream"))
      t="https://verystream.com/e/"
    else if($(e).hasClass("new_player_rapids"))
      t="https://rapidstream.co/embed-"
    else if($(e).hasClass("new_player_cloudvideo"))
      t="https://cloudvideo.tv/embed-"
    else if($(e).hasClass("new_player_mytv"))
      t="https://www.myvi.xyz/embed/"
    else if($(e).hasClass("new_player_uptostream"))
      t="https://uptostream.com/iframe/"
    else if($(e).hasClass("new_player_fembed"))
      t="https://www.fembed.com/v/"
    else if($(e).hasClass("new_player_rapidvideo"))
      t="https://www.rapidvideo.com/e/"
    else if($(e).hasClass("new_player_sibnet"))
      t="https://video.sibnet.ru/shell.php?videoid="
    else if($(e).hasClass("new_player_netu"))
      t="https://waaw.tv/watch_video.php?v="
    else if($(e).hasClass("new_player_rutube"))
      t="https://rutube.ru/play/embed/"
    else if($(e).hasClass("new_player_ok"))
      t="https://www.ok.ru/videoembed/"     
    else if($(e).hasClass("new_player_mail"))
      t="https://videoapi.my.mail.ru/videos/embed/mail/"       
    else if($(e).hasClass("new_player_mail2"))
      t="https://my.mail.ru/video/embed/"  
    else if($(e).hasClass("new_player_gtv"))
      t="https://iframedream.com/embed/"
    else if($(e).hasClass("new_player_myvi"))
      t="//myvi.ru/player/embed/html/"
   return {t:t,z:z};
 }
priorityTask()
task();
