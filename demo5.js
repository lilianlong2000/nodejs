const express = require('express')
const path = require('path')

const app = express()
const router = require('./demo5router.js')
//设置响应头实现跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Coutent-Type', 'utf-8')
  next()
})
app.use(router)

app.listen(8081, () => {
  console.log('running in http://127.0.0.1:8081')
})
