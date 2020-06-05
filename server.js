const express = require('express');
const bodyparser = require('body-parser');
const bcrypt = require('bcrypt');
const cors=require('cors');
const knex=require('knex');
const saltRounds = 10;
const app=express();
app.use(cors());
app.use(bodyparser.json());

const db=knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'venkat',
      database : 'facerecog'
    }
  });

app.post('/signin',(req,res)=>{
   db.select('email','hash').from('login')
   .where('email','=',req.body.email)
   .then(data=>{
    const isValid=bcrypt.compareSync(req.body.password, data[0].hash);
    if(isValid){
        return db.select('*').from('users')
        .where('email','=',req.body.email)
        .then(user=>{
            console.log(user[0]);
            res.json(user[0]);
            console.log('succeuss');
        })
        .catch(err=>res.status(400).json('unable to get user'));
    }
    else{
        return res.status(400).json('wrong credentials');
    }
   })
   .catch(err=>res.status(400).json('wrong credentials'));
});
app.post('/signup',(req,res)=>{
    const{name,email,password}=req.body;
    if(!name||!email||!password)
    {
       return res.status(400).json('invalid entry');
    }
    else{
    const hash = bcrypt.hashSync(password, saltRounds);
    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{
            return db('users')
                .returning('*')
                .insert({
                name:name,
                email:loginEmail[0],
                joined:new Date()
                })
                .then(user=>{
                    return res.json(user[0]);
                })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    }).catch(err=> {
        return res.status(400).json('cannot signup');
    });
    //return res.json(database.user[database.user.length-1]);
    }
});
app.get('/profile/:id',(req,res)=>{
    const{id}=req.params;
    db.select('*').from('users').where({id})
    .then(user=>{
        if(user.length){
            res.json(user[0])
        }
        else{
            res.status(400).json('not found');
        }
    })
    .catch(err=>res.status(400).json('error getting user'));
});
app.put('/image',(req,res)=>{
    const{id}=req.body;
    db('users').where('id','=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entries=>{
        res.json(entries[0]);
    })
    .catch(err=>{
        res.status(400).json('unable to get entries');
    })
})
app.listen(3000,()=>{
    console.log('app is running on port 3000'); 
});
