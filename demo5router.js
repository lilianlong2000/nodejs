const express = require('express')
const router = express.Router()
const fs = require('fs')
// const moment = require('moment')
// const multer = require('multer')
const jwt = require('jsonwebtoken')
const zlib = require('node:zlib')
const {
  addUser,
  loginUser,
  getUserInfo,
  modiUser,
  uploadUserImage,
  searchBlogs,
  searchBlogsTop10,
  searchBlogsAllday,
  searchByid,
} = require('./demo5mysql.js')

const {
  userComment,
  getUserComment,
  commitLikesCollect,
  commitBlogs,
  searchAuthorBlogsAndInfoById,
  initIfLikeAndCollect,
  addView,
  getByBlogsType,
} = require('./demo5mysqlcomment.js')

const secret = 'lixianlongabc'

const bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
router.use(bodyParser.json({ limit: '50mb' }))
// let iat = null
// const Storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, './public/img')
//   },
//   filename: function (req, file, callback) {
//     callback(null, file.originalname)
//   },
// })
// const upload = multer({ storage: Storage })

// router.use(function timeLog(req, res, next) {
//   console.log('Time: ', moment().format('YY-MM-DD HH:mm:ss'))
//   next()
// })

// router.use(bodyParse.urlencoded({ extended: false }))

router.use(function verifyToken(req, res, next) {
  // console.log(req.path)
  // console.log(req.method)
  if (req.path === '/login' || req.path === '/register') {
    next()
  } else {
    if (req.method == 'GET') {
      if (req.query.token) {
        jwt.verify(req.query.token, secret, (err, result) => {
          if (err) {
            res.send({ code: 0, msg: 'token解析失败!' })
            return
          }
          if (result.iat) {
            next()
          } else {
            res.send({ code: 0, msg: '获取数据失败!', reason: 'token验证失败!' })
            return
          }
        })
      } else {
        res.send({ code: 0, msg: '没有获取token' })
      }
    } else if (req.method == 'POST') {
      console.log(req.body)
      if (req.body.token) {
        jwt.verify(req.body.token, secret, (err, result) => {
          if (err) {
            res.send({ code: 0, msg: 'token解析失败!' })
            return
          }
          if (result.iat) {
            next()
          } else {
            res.send({ code: 0, msg: '获取数据失败!', reason: 'token验证失败!' })
            return
          }
        })
      } else {
        res.send({ code: 0, msg: '没有获取token' })
      }
    }
  }
})

router.use('/public', express.static('public'))

router.get('/register', (req, res) => {
  addUser(req.query)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})

router.get('/login', (req, res) => {
  // console.log(req.query)
  const { name, password } = req.query
  loginUser({ name, password })
    .then((results) => {
      jwt.sign(req.query, secret, (err, result) => {
        if (err) {
          res.send({ code: 0, msg: '登录失败,加密token串失败了!' })
          return
        } else {
          setTimeout(() => {
            res.send({ code: 1, msg: results.msg, user: results.user, token: result })
          }, 1000)
          return
        }
      })
    })
    .catch((err) => res.send({ code: 0, msg: err }))
})

router.get('/modipassword', (req, res) => {
  const { name, oldpsw, newpsw } = req.query
  let num = 0
  fs.readFile('./user.txt', (err, data) => {
    if (err) {
      return console.log('读取文件失败')
    }
    console.log(data.toString())
    const obj = JSON.parse(data.toString())
    const userNameAry = Object.keys(obj)
    for (let i = 0; i < userNameAry.length; i++) {
      console.log(obj[userNameAry[i]].name, newpsw, obj[userNameAry[i]].password, oldpsw)
      if (obj[userNameAry[i]].name == name && obj[userNameAry[i]].password == oldpsw) {
        obj[userNameAry[i]].password = newpsw
        fs.writeFile('./user.txt', JSON.stringify(obj), (err) => {
          if (err) {
            return console.log('写入新密码失败!')
          }
        })
        num++
        res.send({ code: 1, msg: '修改密码成功!' })
        return
      } else if (obj[userNameAry[i]].name == name && obj[userNameAry[i]].password != oldpsw) {
        res.send({ code: 0, msg: '旧密码错误!' })
        return
      }
    }
    if (num === 0) {
      res.send({ code: 0, msg: '用户名不存在!' })
      return
    }
  })
})

router.get('/home', (req, res) => {
  console.log(req.query)
  res.send({ code: 1, msg: 'home' })
})

router.post('/upload', (req, res) => {
  const { photo, uid, user } = req.body.params
  uploadUserImage({ name: user }, photo, uid)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})

router.get('/getuserinfo', (req, res) => {
  const { id } = req.query
  console.log(req.query)
  getUserInfo(id)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})

router.post('/changeuserinfo', (req, res) => {
  delete req.body.token
  delete req.body.imageUrl
  modiUser(req.body)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})

router.get('/searchblogs', (req, res) => {
  console.log(req.query)
  if (req.query.title) {
    searchBlogs(req.query)
      .then((result) => {
        res.send({ code: 1, msg: result })
      })
      .catch((err) => {
        res.send({ code: 0, msg: err })
      })
  }
})

router.get('/blogstop10', (req, res) => {
  searchBlogsTop10()
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})

router.get('/searchblogsallday', (req, res) => {
  searchBlogsAllday()
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})

router.get('/getdetailbyid', (req, res) => {
  console.log(req.query)
  const { id, userid } = req.query
  searchByid(id)
    .then((result) => {
      addView()
      res.send({ code: 1, msg: result })
    })
    .catch((err) => res.send({ code: 0, msg: err }))
})

router.get('/usercomment', (req, res) => {
  delete req.query.token
  console.log(req.query)
  userComment(req.query)
    .then((result) => res.send({ code: 1, msg: result }))
    .catch((err) => res.send({ code: 0, msg: err }))
})

router.get('/getusercomment', (req, res) => {
  delete req.query.token
  getUserComment(req.query?.id)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})
router.get('/getiflikeandcollect', (req, res) => {
  const { id, userid } = req.query
  initIfLikeAndCollect(id, userid)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})
router.get('/commitlikescollect', (req, res) => {
  delete req.query.token
  console.log(req.query)
  commitLikesCollect(req.query)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})
router.post('/publishblogs', (req, res) => {
  let data = req.body
  delete data.token
  commitBlogs(data)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})

router.get('/getauthorblogsbyid', (req, res) => {
  console.log(req.query)
  searchAuthorBlogsAndInfoById(req.query.id)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})

router.get('/getbyblogstype', (req, res) => {
  console.log(req.query)
  getByBlogsType(req.query.index)
    .then((result) => {
      res.send({ code: 1, msg: result })
    })
    .catch((err) => {
      res.send({ code: 0, msg: err })
    })
})
module.exports = router
