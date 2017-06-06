var express = require("express");
var Robot = require("./modules/robot.js");
var schedule = require("node-schedule");

var options = {
    domain:"dytt8.NET",
    firstUrl:"http://www.dytt8.Net/",
    outputPath:"./output/testRobot/",
    outputFileName:"test.txt",
    encoding:"GBK",
    timeout:6000,
    robots:true,
    debug:true,
    handlerComplete: function(oResult,file){
        console.log("抓取结束...");
        file.save("\n抓取完成...\n总共访问网页数为"+oResult.iCount+"条，其中成功访问网页数"+oResult.iSuccessNum+"条",true);
    }
};
var robot = new Robot(options);
var reg1 =/\/html\/[a-z0-9]+\/[a-z0-9]+\/[\d]+\/[\d]+\.html/gmi;
var reg2 =/\/html\/[a-z0-9]+\/index\.html/gmi;
//var reg3 = /(ftp|http):\/\/.+\.(rmvb|mp4|avi|flv|mkv|3gp|wmv|wav|mpg|mov)/gmi;

/*var rule = new schedule.RecurrenceRule();
rule.dayOfWeek= [0,new schedule.Range(1,6)];
rule.hour= 19;
rule.minute= 45;
console.log("定时爬取任务，下次爬取时间为" + rule.hour + "时" + rule.minute + "分");

var j = schedule.scheduleJob(rule,function(){
    robot.setOpt({
        outputFileName:getTime()+"-"+"电影天堂.txt"
    });
    console.log("开始定时爬取任务...");
    start();
});*/

start();

function start(){
    robot.go(function( $, aType, url, aNewURLQueue, aTargetURLList, oTargetInfoList ) {

        var self = this;
        var pUrl = url;
        if(url===options.firstUrl){
            var aA = $("a");
            aA.each(function(){
                var href = $(this).attr('href');
                if(href.indexOf("http://") == -1){
                    href = options.firstUrl + href.substring(1);
                }
                var res = reg1.exec(href);
                if(res){
                    aNewURLQueue.indexOf(href) == -1 && aNewURLQueue.push(href);
                }
            });
        }else{
            $('a').each(function(){
                var href = $(this).attr('href');
                var res2 = reg2.exec(href);

                console.log("页面["+pUrl+"]二级页面：【"+ href + "】");

                if(href.indexOf("thunder://") != -1){
                    var url = $(this).text().trim();
                    console.log("\n目标链接【"+$("h1").text().trim()+"】："+url+"\n");
                    var name = $("h1").text().trim();
                    if(aTargetURLList.indexOf(url)){
                        aTargetURLList.push(url);
                        oTargetInfoList[url] = {
                            name:name
                        };
                    }
                    self.file.save(url+"\n",true);

                }else if(href.indexOf("ftp://") != -1){
                    var url = $(this).attr("href");
                    console.log("\n目标链接【"+$("h1").text().trim()+"】："+url+"\n");
                    var name = $("h1").text().trim();
                    if(aTargetURLList.indexOf(url)){
                        aTargetURLList.push(url);
                        oTargetInfoList[url] = {
                            name:name
                        };
                    }
                    self.file.save(url+"\n",true);
                }else if(res2){
                    if(href.indexOf("http://") == -1){
                        href = options.firstUrl + href.substring(1);
                    }
                    var res = reg1.exec(href);
                    if(res){
                        aNewURLQueue.indexOf(href) == -1 && aNewURLQueue.push(href);
                    }
                }
            });
        }
    });
}

function getTime(){
    var date = new Date();

    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var h = date.getHours();
    var mi = date.getMinutes();
    var s = date.getSeconds();

    m = m < 10? "0" + m : m;
    d = d < 10 ? "0" + d : d;
    h = h < 10 ? "0" + h : h;
    mi = mi < 10 ? "0" + mi :mi;
    s = s < 10 ? "0" + s : s;

    return y + "-" + m + "-" + d + " " + h + ":" + mi + ":" + s;
}