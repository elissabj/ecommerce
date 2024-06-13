if (process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}


const initializePassport = require("./passport-config")
const methodOverride = require("method-override")
const session = require("express-session")
const flash = require("express-flash")
const passport = require("passport")
const express = require("express")
const bcrypt = require("bcrypt")

const app = express()
const fs = require("fs")
const path = require("path")
const mysql = require("mysql2")
const multer = require("multer")
const nodemailer = require("nodemailer")
const bodyParser = require("body-parser")


const usuario = "";
const correo = "";

        


initializePassport(passport)

const users = []

app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize()) 
app.use(passport.session())
app.use(methodOverride("_method"))

process.setMaxListeners(0);

//MySQL connect
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME    
  });
  
  db.connect((err) => {
    if (err) {
      console.error('Error conectando a la base de datos:', err.message);
      process.exit(1);
    } else {
      console.log('Conectado a la base de datos MySQL...');
    }
  });


//Registro

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render("register.ejs")
})

app.post("/register", checkNotAuthenticated, async (req, res) => {

    try {
        
        console.log("Nombre: ", req.body.name, " de tipo: ", typeof req.body.name);
        console.log("Email: ", req.body.email, " de tipo: ", typeof req.body.email);
        console.log("Pass sin hash: ", req.body.password, " de tipo: ", typeof req.body.password);
        
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        console.log("Pass con hash: ", hashedPassword, " de tipo: ", typeof hashedPassword);

        usuario = req.body.name;
        correo = req.body.email;
        const contra = hashedPassword;
        

        const query = 'INSERT INTO usuarios (usuario, correo, contra, role) VALUES (?, ?, ?, ?)';
        const rol = 'comprador';
        db.execute(query, [usuario, correo, contra, rol], (err, results) => {
            if (err) {
              console.error('Error ejecutando la consulta:', err.message);
              if (err.code === 'ER_DUP_ENTRY') {
                res.render('register', { error: 'Correo ya registrado', correo: correo });
              } else {
                res.status(500).send('Error en el servidor');
              }
              console.log(results);
            }
          });
        users.push({
            id: Date.now().toString(), 
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        })
        console.log(users);
        res.redirect("/login")
        
    } catch (e) {
        console.log(e);
        res.redirect("/register")
    }
})


//Inicio de sesion

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render("login.ejs")
})


app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))


// Pantalla principal
app.get('/', checkAuthenticated, (req, res) => {
    res.render("index.ejs", {name: req.user.name})
})

// TODO CERRAR SESION
app.delete("/logout", (req, res) => {
    req.logout(req.user, err => {
        if (err) return next(err)
        res.redirect("/")
    })
})

//Manejo de imagenes 
const subir_imagen = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(subir_imagen)) {
  fs.mkdirSync(subir_imagen, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, subir_imagen);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
  
const upload = multer({ storage: storage });


// Productos

//Obtener los productos
app.get('/agregar-producto', checkAuthenticated, (req, res) => {
    res.render('agregar-producto.ejs'); // Renderiza la vista "subir producto"
})


//Agregar los productos a la base de datos 


app.post('/agregar-producto', checkAuthenticated, (req, res) => {
    const {nombre, precio, cantidad, categoria} = req.body;
    const imagen = req.file;


    console.log("Datos recibidos:", req.body);
    console.log('Imagen recibida', imagen);


    //Renombrar imagen

    const prev_nombre = `${imagen.filename}`;

    const prefix = usuario;

    console.log(prefix)
    console.log(prev_nombre)

    const currentImageName = prefix + prev_nombre;
    const getVendor_id = -1

    const getUser_ID = 'SELECT usuario_id from usuarios WHERE correo = ?';
    db.execute(query,[correo], (err,results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err.message);
            res.status(500).send({ success: false, message: 'Error en el servidor' });
        }else if (results.length === 0){
            res.status(400).send({ success: false, message: 'No se pudo obtener la informacion del vendedor', redirect: '/' });
        }

        getVendor_id = results;
    })

    const query = 'INSERT INTO productos (nombre, precio,cantidad,categoria, vendedor_id, nombre_imagen) VALUES (?,?,?,?,?,?)'
    db.query(inserquerry, [nombre, precio,cantidad,categoria, getVendor_id, currentImageName], (err, results) => {
        if (err) {
            console.error('error al insertar en la bd', err);
        }
    });
})



app.get('/carrito-compra', checkAuthenticated, (req, res) => {
	res.render('carrito-compra.ejs');
})




function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect("/login")
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect("/")
    }
    next()
}




app.listen(3001)


/*
AprovechR INICIO DE SESION
vender_id = 

select vendedor_id from usuarios where correo = ? 

*/