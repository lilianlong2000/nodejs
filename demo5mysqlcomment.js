const res = require('express/lib/response')
const mysql = require('mysql')
const zlib = require('node:zlib')
const sql = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'test',
})
sql.connect()
const { getUserInfo } = require('./demo5mysql.js')
function userComment(data) {
  return new Promise(function (resolve, reject) {
    let s =
      'INSERT INTO comment(comment,blog_id,parent_id,user_id,time,comment_id) VALUE(?,?,?,?,?,?)'
    const { comment, blog_id, parent_id, user_id, comment_id } = data
    sql.query(s, [comment, blog_id, parent_id, user_id, new Date(), comment_id], (err, data) => {
      if (err) return reject(err)
      if (data.affectedRows !== 1) return reject('评论失败!')
      else return resolve('评论成功!')
    })
  })
}

function getUserCommentChildren(id) {
  return new Promise(function (resolve, reject) {
    let s = 'SELECT * FROM comment WHERE blog_id = ? and parent_id IS NULL'
    sql.query(s, [id], (err1, data1) => {
      if (err1) return reject(err1)
      let result = []
      let num = 0
      let s = 'SELECT id,name,sex,age,photo FROM user WHERE id = ?'
      for (let i = 0; i < data1.length; i++) {
        sql.query(s, [data1[i].user_id], (err, data) => {
          num++
          if (err) return reject(err)
          let obj = {
            user: data[0],
            comment: data1[i].comment,
            commentid: data1[i].id,
            time: data1[i].time,
          }
          result.push(obj)
          if (num >= data1.length) {
            resolve(result)
          }
        })
      }
    })
  })
}

function getUserComment(id) {
  return new Promise(function (resolve, reject) {
    getUserCommentChildren(id)
      .then((result) => {
        let s = 'SELECT * FROM comment WHERE comment_id = ?'
        let num1 = 0
        for (let j = 0; j < result.length; j++) {
          sql.query(s, [result[j].commentid], (err, data) => {
            if (err) return reject(err)
            console.log(data)
            if (data.length == 0) {
              result[j].children = []
              num1++
              if (num1 == result.length) {
                resolve(result)
              }
            } else {
              let s = 'SELECT id,name,photo FROM user WHERE id = ?'
              let children = []
              for (let i = 0; i < data.length; i++) {
                sql.query(s, [data[i].user_id], (err2, data2) => {
                  if (err2) return reject(err)
                  sql.query(s, [data[i].parent_id], (err1, data1) => {
                    if (err1) return reject(err)
                    children.push({
                      user: data2[0],
                      usered: data1[0],
                      comment: data[i].comment,
                      time: data[i].time,
                    })
                    result[j].children = children
                    setTimeout(() => {
                      resolve(result)
                    }, 30)
                  })
                })
              }
            }
          })
        }
      })
      .catch((err) => {
        reject(err)
      })
  })
}

function initIfLikeAndCollect(id, userid) {
  return new Promise(function (resolve, reject) {
    let s = 'SELECT likes_user,collect_user FROM blogs WHERE id=?'
    sql.query(s, [id], (err, data) => {
      if (err) return reject('获取点赞收藏失败!')
      let isLikes = data[0].likes_user.includes('&' + userid)
      let isCollect = data[0].collect_user.includes('&' + userid)
      return resolve({ isLikes, isCollect })
    })
  })
}

function searchUserIfLike(id) {
  return new Promise(function (resolve, reject) {
    let s = 'SELECT likes_user FROM blogs WHERE id =?'
    sql.query(s, [id], (err, data) => {
      if (err) return reject('点赞失败!')
      if (data[0].likes_user == null) {
        return resolve('')
      }
      return resolve(data[0].likes_user)
    })
  })
}
function searchUserIfCollect(id) {
  return new Promise(function (resolve, reject) {
    let s = 'SELECT collect_user FROM blogs WHERE id =?'
    sql.query(s, [id], (err, data) => {
      if (err) return reject('点赞失败!')
      if (data[0].likes_user == null) {
        return resolve('')
      }
      return resolve(data[0].collect_user)
    })
  })
}
// function searchUserIfView(id) {
//   return new Promise(function (resolve, reject) {
//     let s = 'SELECT collect_user FROM blogs WHERE id =?'
//     sql.query(s, [id], (err, data) => {
//       if (err) return reject('点赞失败!')
//       if (data[0].likes_user == null) {
//         return resolve('')
//       }
//       return resolve(data[0].)
//     })
//   })
// }
function commitLikesCollect(data) {
  return new Promise(function (resolve, reject) {
    console.log(data)
    const { id, isLikes, isCollect, type, userid } = data
    if (type === '1') {
      searchUserIfLike(id).then((res) => {
        let result = isLikes == 'true' ? '取消' : ''
        let s = `UPDATE blogs set likes=likes+1 ,likes_user=CONCAT(likes_user,"${
          '&' + userid
        }") WHERE id = ?`
        if (isLikes == 'false') {
          sql.query(s, [id], (err, data) => {
            console.log(err, data)
            if (err) return reject(err)
            if (data.affectedRows !== 1) return reject('点赞失败!')
            else return resolve(result + '点赞成功!')
          })
        } else if (isLikes == 'true') {
          let regexp = new RegExp('&' + userid, 'g')
          res = res.replace(regexp, '')
          let s = 'UPDATE blogs set likes=likes-1 , likes_user=? WHERE id=?'
          sql.query(s, [res, id], (err, data) => {
            if (err) return reject(err)
            if (data.affectedRows !== 1) return reject(result + '点赞失败!')
            else return resolve(result + '点赞成功!')
          })
        }
      })
    } else if (type === '2') {
      searchUserIfCollect(id).then((res) => {
        let result = isCollect == 'true' ? '取消' : ''
        let s = `UPDATE blogs set collect=collect+1 ,collect_user=CONCAT(collect_user,"${
          '&' + userid
        }") WHERE id = ?`
        if (isCollect == 'false') {
          sql.query(s, [id], (err, data) => {
            if (err) return reject(err)
            if (data.affectedRows !== 1) return reject('收藏失败!')
            else return resolve(result + '收藏成功!')
          })
        } else if (isCollect == 'true') {
          let regexp = new RegExp('&' + userid, 'g')
          res = res.replace(regexp, '')
          let s = 'UPDATE blogs set collect=collect-1 , collect_user=? WHERE id=?'
          sql.query(s, [res, id], (err, data) => {
            if (err) return reject(err)
            if (data.affectedRows !== 1) return reject(result + '收藏失败!')
            else return resolve(result + '收藏成功!')
          })
        }
      })
    }
  })
}

function commitBlogs(data) {
  const { id, title, content, name } = data
  let s =
    'INSERT INTO blogs(author_id,title,content,author,time,likes,collect,view) VALUE(?,?,?,?,?)'
  return new Promise(function (resolve, reject) {
    sql.query(s, [id, title, content, name, new Date(), 0, 0, 0], (err, data) => {
      if (err) return reject('发布失败!')
      else return resolve('发布成功!')
    })
  })
}

function searchAuthorBlogsAndInfoById(id) {
  return new Promise(function (resolve, reject) {
    getUserInfo(id)
      .then((result) => {
        let s = 'SELECT * FROM BLOGS WHERE author_id = ?'
        sql.query(s, [id], (err, data) => {
          if (err) return reject('获取失败!')
          return resolve({ user: result, blogs: data })
        })
      })
      .catch((err) => {
        reject('获取失败!')
      })
  })
}

function addView(id, userid) {
  let s = 'UPDATE blogs SET view=view+1 , '
}

function getByBlogsType(id) {
  return new Promise(function (resolve, reject) {
    let s = 'SELECT * FROM blogs WHERE blogs_type=? LIMIT 10'
    sql.query(s, [id], (err, data) => {
      if (err) return reject(err)
      return resolve(data)
    })
  })
}
module.exports = {
  userComment,
  getUserComment,
  commitLikesCollect,
  commitBlogs,
  searchAuthorBlogsAndInfoById,
  initIfLikeAndCollect,
  addView,
  getByBlogsType,
}
