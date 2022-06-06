const mysql = require('mysql')
const Mock = require('mockjs')
const dayjs = require('dayjs')
const Random = Mock.Random
const sql = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'test',
})
sql.connect()

function searchUser(data) {
  return new Promise(function (resolve, reject) {
    let s = 'select * from user where name = ?'
    sql.query(s, [data.name], (err, data) => {
      if (err) return reject(err)
      return resolve(data[0])
    })
  })
}
async function addUser(data) {
  const { name, password, age, sex } = data
  const result = await searchUser(data)
  if (!result) {
    return new Promise(function (resolve, reject) {
      let s2 = 'INSERT INTO user(name,password,age,sex,register_time) value(?,?,?,?,?)'
      sql.query(s2, [name, password, age, sex, new Date()], (err, data) => {
        console.log(err, data)
        if (err) return reject(err)
        if (data.affectedRows !== 1) return reject('注册失败!')
        else return resolve('注册成功!')
      })
    })
  } else {
    return Promise.reject('用户名已经存在!')
  }
}

async function loginUser(data = { name: '李先龙', password: '123456' }) {
  const result = await searchUser(data)
  return new Promise((resolve, reject) => {
    if (!result) {
      reject('未找到该用户名!')
      return
    }
    if (result.password != data.password) {
      reject('密码错误!')
      return
    }
    resolve({ msg: '登录成功!', user: result })
    return
  })
}

function getUserInfo(id) {
  return new Promise(function (resolve, reject) {
    let s = 'SELECT * FROM user WHERE id =?'
    sql.query(s, [id], (err, data) => {
      if (err) return reject(err)
      resolve(data[0])
    })
  })
}

function modiUser(data) {
  const { blogsintroduction, selfintroduction, newpsw, sex, age, name, oldpsw, modinopsw } = data
  console.log(data)
  return new Promise(async function (resolve, reject) {
    const result = await searchUser({ name })
    console.log(result)
    if (!result) {
      return reject('未找到该用户名!')
    }
    if (result.password !== oldpsw) {
      return reject('原密码错误!')
    }
    if (oldpsw === newpsw && modinopsw !== 'true') {
      return reject('不能与原密码相同!')
    }
    let s =
      'update user set password=?, sex=? ,age=?,blogsintroduction=?,selfintroduction=? where name=?'
    sql.query(s, [newpsw, sex, age, blogsintroduction, selfintroduction, name], (err, data) => {
      console.log(err, data)
      if (err) {
        return reject('修改信息失败!')
      }
      if (data.affectedRows !== 1) return reject('修改信息失败!')
      return resolve('修改信息成功!')
    })
  })
}

function insertregistertime() {
  let s = 'UPDATE  user SET register_time=?'
  sql.query(s, [new Date()], (err, data) => {
    console.log(err, data)
  })
}
insertregistertime()
function uploadUserImage(data, photo, uid) {
  const {
    name: { name },
  } = data
  return new Promise(async function (resolve, reject) {
    const result = await searchUser({ name })
    if (!result) return reject('未找到该用户!')
    let s = 'UPDATE user SET photo=?,photo_id=? WHERE name=?'
    sql.query(s, [photo, uid, name], (err, data) => {
      console.log(err, data)
      if (err) return reject('上传头像失败!')
      return resolve('上传头像成功!')
    })
  })
}

function searchBlogs(data) {
  return new Promise(function (resolve, reject) {
    if (data.time) {
      let { endtime, nowtime } = handletime(data)
      let s = `SELECT * FROM blogs WHERE title like '%${data.title}%' and date(time) between '${endtime}' and '${nowtime}'`
      sql.query(s, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    } else {
      let s = `SELECT * FROM blogs WHERE title like '%${data.title}%'`
      sql.query(s, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    }
  })
}
function searchBlogsAllday() {
  return new Promise(function (resolve, reject) {
    let result = []
    let obj = [{ time: '1' }, { time: '2' }, { time: '3' }, { time: '4' }, { time: '5' }]
    obj.forEach((item, index) => {
      let { endtime, nowtime } = handletime(item)
      let s = `SELECT * FROM blogs WHERE date(time) between '${endtime}' and '${nowtime}' LIMIT 10`
      sql.query(s, (err, data) => {
        if (err) return reject(err)
        let obj = { data: data, title: item.time, name: item.time }
        result[index] = obj
        if (index === 4) {
          resolve(result)
        }
      })
    })
  })
}
//模拟数据插入博客文章详情函数
function insertInto() {
  let s = 'INSERT INTO blogs(author,title,content,time,likes,collect,view) VALUES(?,?,?,?,?,?,?)'
  for (let i = 0; i < 10000; i++) {
    sql.query(
      s,
      [
        Random.cname(),
        Random.ctitle(3, 30),
        Random.cparagraph(2, 8),
        Random.datetime(),
        parseInt(Math.random() * 100),
        parseInt(Math.random() * 100),
        parseInt(Math.random() * 100),
      ],
      (err, data) => {
        if (data) {
          console.log('插入成功')
        } else {
          console.log('插入失败')
        }
      }
    )
  }
}
//插入模拟用户函数
function insertIntoUser() {
  let s = 'INSERT INTO user(name,password,sex,age) VALUE(?,?,?,?)'
  for (let i = 0; i < 400; i++) {
    let { sex } = Mock.mock({ 'sex|1': ['男', '女'] })
    let { regexp } = Mock.mock({ regexp: /(?=.*d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&]).{6,16}/ })
    sql.query(s, [Random.cname(), regexp, sex, 0], (err, data) => {
      if (err) return console.log(err)
      console.log('插入成功')
    })
  }
}

function searchBlogsTop10() {
  return new Promise(function (resolve, reject) {
    let s = 'SELECT * FROM blogs ORDER BY likes DESC LIMIT 10'
    sql.query(s, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}
//时间处理函数，计算一天，一周，一月，一年，两年前的时间
function handletime(data) {
  let s = 'YYYY-MM-DD HH-mm-ss'
  switch (data.time) {
    case '1':
      return {
        endtime: dayjs(new Date().getTime() - 24 * 60 * 60 * 1000).format(s),
        nowtime: dayjs().format(s),
      }
    case '2':
      return {
        endtime: dayjs(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).format(s),
        nowtime: dayjs().format(s),
      }
    case '3':
      return {
        endtime: dayjs(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).format(s),
        nowtime: dayjs().format(s),
      }
    case '4':
      return {
        endtime: dayjs(new Date().getTime() - 365 * 24 * 60 * 60 * 1000).format(s),
        nowtime: dayjs().format(s),
      }
    case '5':
      return {
        endtime: dayjs(new Date().getTime() - 2 * 365 * 24 * 60 * 60 * 1000).format(s),
        nowtime: dayjs().format(s),
      }
    default:
      return { endtime: undefined, nowtime: undefined }
  }
}

function searchBytime(endTime) {
  return new Promise(function (resolve, reject) {
    let nowtime = dayjs().format('YYYY-MM-DD HH-mm-ss')
    let s = `SELECT title,time FROM blogs WHERE date(time) between '${endTime}' and '${nowtime}'`
    sql.query(s, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
        console.log(data)
      }
    })
  })
}
// searchBytime('2020-5-20 03-22-22')

function searchByid(id) {
  return new Promise(function (resolve, reject) {
    let s = 'SELECT * FROM blogs WHERE id = ?'
    sql.query(s, [id], (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

module.exports = {
  addUser,
  loginUser,
  modiUser,
  uploadUserImage,
  searchBlogs,
  searchBlogsTop10,
  searchBytime,
  searchBlogsAllday,
  searchByid,
  getUserInfo,
}
