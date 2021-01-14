
var express = require("express");
var session = require('express-session');
var cookie = require("cookie-parser");
var SHA256 = require("crypto-js/sha256");
var CryptoJS = require("crypto-js");

server = express();


var bodyParser = require("body-parser");
var formidable = require("formidable");
var fs = require("fs");
var sizeOf = require('image-size');
var Datastore = require('nedb');

var Users = new Datastore({ filename: __dirname + '/data/pass.db', autoload: true });//會員的資料庫
var Print = new Datastore({ filename: __dirname + '/data/print.db', autoload: true });//影印店的資料庫
var Usermessage = new Datastore({ filename: __dirname + '/data/messageData.db', autoload: true });//會員的資料庫
var Answermessage = new Datastore({ filename: __dirname + '/data/answerData.db', autoload: true });//回覆留言的資料庫
var Userproduct = new Datastore({ filename: __dirname + '/data/product.db', autoload: true });//商品訊息資料庫


// var userData = [
// {"id":"1410722008", "password":"12345687", "name":"田御旻"},
// {"id":"1410722009", "password":"12345687", "name":"吳語涵"},
// {"id":"1410722024", "password":"12345687", "name":"林品萱"},
// // {"id":"1410722025", "password":"12345687", "name":"柯佳伶"},
// ];

// Users.insert(userData);

// var printData = [
// {"name":"加恩數位印刷", "address":"台中市北區中華路二段187號", "phone":"04-22031553", "time":"09:00–21:00", "closed":"每周六", "sweet":"曾經發生過隨身碟中毒!養成使用雲端的習慣避免悲劇!"},
// {"name":"多媒系辦影印機", "address":"昌明樓四樓多媒系辦", "phone":"04-22031553", "time":"同系辦工作時間", "closed":"", "sweet":"須先儲值影印卡，最低100元影印機沒墨水需要跑流程後才能補充建議不要拖到最後一刻才去印！有可能會開天窗喔！"},
// {"name":"野貓設計工作室", "address":"台中市北區五權路327巷7號", "phone":"04-22034748", "time":"", "closed":"", "sweet":"真正的隱藏版店家，找不到才是正常，不管你有多懷疑是不是對的，OK超商旁的巷子，走進去就對了！"},
// ];

// Print.insert(printData);

// var messageData = [
// {"id":"1410722008", "name":"田御旻", "message":"測試文字","check":"message","answer":"測試文字", "answerid":"1410722025", "answername":"管理員", "answermessage":"我來了","date":1610520119895}
// ];

// Usermessage.insert(messageData);

// var answerData = [
// {},
// ];

// Answermessage.insert(answerData);

// var productData = [
// {"Description":"英文課本9成新","price":"100","img":"6.png"},
// {"Description":"相機7成新微微刮傷","price":"5000","img":"7.png"},
// {"Description":"基設黑卡紙","price":"5","img":"8.png"},
// ];

// Userproduct.insert(productData);

server.use(cookie());
server.use(session({ secret: 'secret key', cookie: { maxAge: 2160000 } }));

server.use(express.static('final'));//web root
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.text({ type: 'text/html' }));
server.use(bodyParser.json({ type: 'application/*+json' }));

server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

// var pwd=SHA256(Users.password).toString(CryptoJS.enc.Hex);

// server.get("/signin", function(req, res){
//   Users.find({}, function(err, result){
//     if(err==null){
//       res.render("form",{student: result})
//     }
//   })
// })

// server.get("/gameform", function (req, res) {
//     Users.find({}, function(err, result){
//          if(err!=null){
//            res.render("gameform", {student: result})
//          }
//     })
// });

// req.body.uid!=result('id')


//註冊不能重複且輸入不得為空
server.post("/pass", function (req, res) {
  if (req.body.id == '' || req.body.password == '' || req.body.name == '') {
    res.json({ ret_code: 3, ret_msg: "輸入不得為空!" });
  } else {
    Users.find({ id: req.body.id }, function (err, result) {
      if (err == null && result.length == 0) {
        Users.insert({ id: req.body.id, password: req.body.password, name: req.body.name });
        // res.render("success", { success: "註冊成功!", next: "index.html" });
        res.json({ ret_code: 0, ret_msg: '註冊成功' });
      } else {
        // res.render("error", { error: "重複註冊!", next: "javascript:history.back()" });
        res.json({ ret_code: 4, ret_msg: '重複註冊' });
      };
    });
  }
});


//登入設session.cookie
server.post("/signin", function (req, res) {
  if (req.body.id == '' || req.body.password == '') {
    res.json({ ret_code: 3, ret_msg: "輸入不得為空!" });
  } else if (req.body.id == '1410722025' && req.body.password == 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f') {
    req.session.regenerate(function (err) {
      if (err) {
        return res.json({ ret_code: 2, ret_msg: "登入失敗" });
      }
      req.session.loginUser = req.body.id;
      res.json({ ret_code: 4, ret_msg: '管理員登入成功' });
    });
  } else {
    Users.find({ id: req.body.id, password: req.body.password }, function (err, result) {
      if (err == null && result.length > 0) {
        req.session.regenerate(function (err) {
          if (err) {
            return res.json({ ret_code: 2, ret_msg: "登入失敗" });
          }
          req.session.loginUser = req.body.id;
          req.session.views = 1;
          res.json({ ret_code: 0, ret_msg: '登入成功' });
        });
      } else {
        res.json({ ret_code: 1, ret_msg: '帳號或密碼錯誤' });
      }
    });
  }
});

//成功新增session並到首頁
server.get('/', function (req, res, next) {
  if (req.session.loginUser == undefined) {
    res.render("index", { name: req.session.loginUser });
  }else{
    res.render("index", { name:req.session.loginUser });
  }
});

//首頁
server.get('/home', function (req, res, next) {
  if (req.session.loginUser == undefined) {
    res.redirect("/login", { name: req.session.loginUser });
  } else {
    res.render("index", { name: req.session.loginUser });
  }
});

//我要幫助學弟妹
server.get('/help', function (req, res) {
  res.render("help", { name: req.session.loginUser });
});

//註冊
server.get('/registered', function (req, res) {
  res.render("pass", { name: req.session.loginUser });
});

//登入
server.get('/login', function (req, res) {
  res.render("signin", { name: req.session.loginUser });
});

//上架
server.get('/up', function (req, res) {
  res.render("up", { name: req.session.loginUser });
});

//不求人指南
server.get('/resource', function (req, res) {
  res.render("resource", { name: req.session.loginUser });
});

//輸出店錦囊
server.get('/print', function (req, res) {
  res.render("print", { name: req.session.loginUser });
});

//二手物交換
server.get('/exchange', function (req, res) {
  Userproduct.find({},function(err, result){
    if(err == null && result.length > 0){
        res.render("exchange",{exchange:result, name:req.session.loginUser});
    }else{
    res.render("error", { error: "錯誤!", next: "javascript:history.back()" });  
    }
  })
});

//商品資訊
server.post('/product', function (req, res) {
  Userproduct.find({Description:req.body.productd},function(err, result){
    if(err == null && result.length > 0){
      res.render("product",{product:result, name:req.session.loginUser, description:req.body.productd, user:req.session.loginUser});
    }else{
      res.render("error", { error:"找不到", next:"javescript:history.back()"});
    }
  })
});

//疑難來解惑
server.get('/question', function (req, res) {
  res.render("question", { name: req.session.loginUser });
});

server.get('/answer1', function (req, res) {
  res.render("answer1", { name: req.session.loginUser });
});

server.get('/answer2', function (req, res) {
  res.render("answer2", { name: req.session.loginUser });
});

server.get('/answer3', function (req, res) {
  res.render("answer3", { name: req.session.loginUser });
});
server.get('/answer4', function (req, res) {
  res.render("answer4", { name: req.session.loginUser });
});

//登出unsetcookie
server.get('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) {
      res.json({ ret_code: 2, ret_msg: '退出登入失敗' });
      return;
    }
    // req.session.loginUser = null;
    res.clearCookie();
    res.redirect('/');
  });
});

server.get('/userupdate', function (req, res) {
  if (req.session.loginUser == undefined) {
    res.render("update", { name: req.session.loginUser });
  }
});


//修改密碼
server.post("/update", function (req, res) {
  if (req.body.id == '' || req.body.password == '' || req.body.password2 == '') {//看欄位是不是空白
    res.json({ ret_code: 3, ret_msg: "輸入不得為空!" });
  } else if (req.session.loginUser == undefined) {
    res.json({ ret_code: 4, ret_msg: '尚未登入' });//找一下session還在不在
  } else {
    Users.find({ id: req.body.id, password: req.body.password }, function (err, result) {//在users資料庫中找資料
      if (err == null && result.length > 0) {
        Users.update({ id: req.body.id }, { $set: { password: req.body.password2 } });//更新資料
        res.json({ ret_code: 0, ret_msg: '修改成功' });
      } else {
        res.json({ ret_code: 1, ret_msg: '帳號或密碼錯誤' });
      }
    });
  }
});

server.get('/userdelete', function (req, res) {
  if (req.session.loginUser == undefined) {
    res.render("delete", { name: req.session.loginUser });
  }
});

//刪除帳號
server.post("/delete", function (req, res) {
  if (req.body.id == '' || req.body.password == '') {
    res.json({ ret_code: 3, ret_msg: "輸入不得為空!" });//看欄位是不是空白
  } else {
    Users.findOne({ id: req.body.id, password: req.body.password }, function (err, result) {//找一下資料庫有沒有資料
      if (err == null && result != null) {
        Users.remove({ id: req.body.id }, function (err, result) {//刪除資料
          if (err == null) {
            res.json({ ret_code: 0, ret_msg: '刪除成功' });
          } else {
            res.json({ ret_code: 2, ret_msg: '刪除失敗' });
          }
        });
      } else {
        res.json({ ret_code: 1, ret_msg: '帳號或密碼錯誤' });
      }
    })
  }
});

//留言頁面
server.get("/messagepost", function (req, res) {
  Users.find({ id: req.session.loginUser }, function (err, result) {//先找找session在不在
    if (err == null) {
      res.render("messagepost", { messagepost: result })
    } else {
      res.render("error", { error: "錯誤!", next: "javascript:history.back()" });
    }
  });
});

//"我要"留言並送到留言板
server.post("/message", function (req, res) {
  // res.render("message",{});
  if (req.body.umessage == '') {
    res.render("error", { error: "輸入不得為空", next: "javascript:history.back()" });
  } else if (req.session.loginUser == undefined) {
    res.render("error", { error: "尚未登入", next: "/login" });
  } else {
    var num;
    Usermessage.find({ check: "message" }, function (err, result) {
      if (err == null && result.length > 0) {
        num = result.length;
      }
      else {
        num = 0;
      }
    });
    Users.find({ id: req.session.loginUser }, function (err, result) {
      if (err == null && result.length > 0) {
        //為了將名字送到allmessage，設item找使用者名字
        result.forEach(function (item) {
          Usermessage.insert({ id: req.session.loginUser, name: item.name, message: req.body.umessage, check: "message" , date:Date.now() });//新增到message資料庫
        });
        // message = req.body.umessage;
        res.render("success", { success: "留言成功", next: "/allmessage" });
      } else {
        res.render("error", { error: "留言失敗", next: "javascript:history.back()" });
      }
    });
  }
});

//回覆留言
server.post("/answermessage", function (req, res) {
  if (req.body.umessage == '') {
    res.render("error", { error: "輸入不得為空", next: "javascript:history.back()" });
  } else if (req.session.loginUser == undefined) {
    res.render("error", { error: "尚未登入", next: "/login" });
  } else {
    Users.find({ id: req.session.loginUser }, function (err, result) {
      if (err == null && result.length > 0) {
        result.forEach(function (item) {
          Usermessage.find({ message: req.body.answer }, function (err, result) {
            var umname = [] ;
            var i=0;
            if (err == null && result.length > 0) {
              result.forEach(function(item, array1)  {
                array1 = umname.push([item.id, item.name , item.message, item.check]);
                console.log(umname[i]);
                i++;
              });
              // Usermessage.insert({user:umname[i]  , answerid: req.session.loginUser, answername: item.name, answermessage: req.body.umessage, answer: req.body.answer });//新增到message資料庫
              Usermessage.update({ message: req.body.answer }, { $set:{ answerid:req.session.loginUser, answername: item.name, answermessage:req.body.umessage } });//更新資料
            }
          });

          // Usermessage.update({ message: req.body.answer }, { $set:{ answerid:req.session.loginUser, answername: item.name, answermessage:req.body.umessage } });//更新資料
          // Answermessage.insert({ answer: req.body.answer, answerid:req.session.loginUser, answername: item.name, answermessage:req.body.umessage});//新增到message資料庫
          // Usermessage.insert({ answer: req.body.answer, answerid:req.session.loginUser, answername: item.name, answermessage:req.body.umessage});//新增到message資料庫

        });
        res.render("success", { success: "留言成功", next: "/allmessage" });
      } else {
        res.render("error", { error: "留言失敗", next: "javascript:history.back()" });
      }
    });
  }
});

//留言板輸出ejs留言
server.get("/allmessage", function (req, res) {
  Usermessage.find({}).sort({date:1}).exec(function (err, result) {
    var umname = [] ;
    var i=0;
    if (err == null && result.length >= 0) {
      result.forEach(function(item, array1)  {
        array1 = umname.push([item.name , item.message]);
        // console.log(umname[i]);
        i++;
      });
      // Answermessage.find({ answer:ummessage }).sort({}).exec(function (err, doc) {
      //   if (err == null && doc.length >= 0) {
          res.render("allmessage", { allmessage: result, umn: umname[i], usermessage: req.session.loginUser, answer: req.body.answer });
      //   }
      // })
    }
  })
});

//加圖片範例
server.get("/addimg", function (req, res) {
  Users.find({}, function (err, result) {
    if (err == null) {
      var i = 0;
      result.forEach(function (item) {
        Users.update({ id: item.id }, { $set: { img: "img_avator" + (i % 6 + 1) } });
        i++;
      })
      res.end("OK");
    }
  })
});

server.post("/add", function (req, res) {
  var form = formidable.IncomingForm();
  form.maxFileSize = 280 * 280;
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.log("File size too large!");
      res.render("error", { error: err.message, next: "javascript:history.back()" })
    } else {
      
      var gotFields = fields;
      var fileExt = files.poster.name.split(".")[1];
      gotFields.poster = files.poster.name ;
      var posterPath = "final/upload/" + gotFields.poster;
      fs.renameSync(files.poster.path, posterPath);
      Userproduct.insert({Description:fields.Description, price:fields.price,img:files.poster.name });//新增到product資料庫 
      res.render("success", { success: "上傳成功", next: "/exchange" });
      //check image size
      // sizeOf(posterPath, function (err, dim) {
      //   if (err) {
      //     res.render("error", { error: "Cannot read uploaded image file.", next: "javascript:history.back()" });
      //   } else {
      //     if (dim.width != 275 || dim.height != 183) {
      //       res.render("error", { error: "Image size requires 800x400.", next: "javascript:history.back()" });
      //       fs.unlinkSync(posterPath);
      //     } else {
      //       //record to database, nedb, mongodb
      //       res.render("game", { id: gotFields.id });
      //     }
      //   }
      // })
    }
  })
});

var AdmZip = require('adm-zip');
const { Session } = require("inspector");

server.post("/addgamefile", function (req, res) {
  var form = formidable.IncomingForm();
  form.maxFileSize = 4000 * 1024;
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.log("File size too large!");
      res.render("error", { error: err.message, next: "javascript:history.back()" })
    } else {
      var gamepath = "Exercise1/game/" + fields.id;
      var ext = files.gamezip.name.split(".")[1];
      try {
        if (ext == "zip") {
          var zip = new AdmZip(files.gamezip.path);
          zip.extractAllTo(gamepath, true);
          res.render("success", { error: "Success uploaded." });
        }
      } catch (err) {
        res.render("error", { error: "cannot unzip uploaded file" })
      }
      fs.unlinkSync(files.gamezip.path);

    }
  })
});

server.get("/", function (req, res) {
  res.send("Hello World!");
});

server.get("/md2020", function (req, res) {
  res.send("Hello MD2020!");
});

server.post("/md2020", function (req, res) {
  res.send("Hello MD2020!");
});

server.get("*", function (req, res) {
  res.send("Page not found", 404);
})

server.listen(8080);
console.log("Server running on port: 8080");
