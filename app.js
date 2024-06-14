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

const mysql_sync = require("sync-mysql")

var currentMail=""

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

// Set up storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null,  path.join(__dirname, 'uploads')) // specify upload directory
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)) // rename file
    }
});

// Initialize multer upload middleware
const upload = multer({ storage: storage });

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

        const usuario = req.body.name;
        const correo = req.body.email;
        const contra = hashedPassword;
        
        currentMail = req.body.email;

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


app.post("/login", checkNotAuthenticated, (req, res, next) => {
    currentMail = req.body.email; 
    console.log(currentMail)
    
    passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
})(req, res,next);
})


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


// Productos

//Obtener los productos
app.get('/agregar-producto', checkAuthenticated, (req, res) => {
    res.render('agregar-producto.ejs'); // Renderiza la vista "subir producto"
})


//Agregar los productos a la base de datos 
app.post('/agregar-producto', upload.single('imagen'), checkAuthenticated, async (req, res) => {

    console.log("Entro al POST");

    const { nombre, precio, cantidad, categoria } = req.body;
    const imagen = req.file;

        // Check if required fields are present
    if (!nombre || !precio || !cantidad || !categoria || !imagen) {
        return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    console.log("Correo:", currentMail);

        // Get user ID based on email
    const getUserQuery = 'SELECT usuario_id FROM usuarios WHERE correo = ?';
    var vendedorId  = 0
    
    db.execute(getUserQuery, [currentMail], (err,results) => {
        if(err || results.length === 0){
            console.error('Error ejecutando la consulta:', err.message);
            return res.status(500).send({ success: false, message: 'Error en el servidor' });
        }
        console.log(results)
        console.log(results[0].usuario_id, typeof results[0].usuario_id)
        vendedorId = results[0].usuario_id;
        console.log(vendedorId)

        console.log("Nombre del Producto:", nombre);
        console.log("Precio:", precio);
        console.log("Cantidad:", cantidad);
        console.log("Categoria:", categoria);
        console.log("Nombre del archivo de imagen:", imagen.filename);
        console.log("Nombre del vendedor:", vendedorId);

        const insertQuery = 'INSERT INTO productos (nombre, precio, cantidad, categoria_id, vendedor_id, nombre_imagen) VALUES (?, ?, ?, ?, ?, ?)';
        db.execute(insertQuery, [nombre, precio, cantidad, categoria, vendedorId, imagen.filename], (err, results) => {
            console.log(results)
            if(err || results.length === 0){
                console.error('Error ejecutando la consulta:', err.message);
                return res.status(500).send({ success: false, message: 'Error en el servidor' });
            }
            // Respond with success message
            console.log('Producto agregado correctamente');
            return res.status(200).json({ success: true, message: 'Producto agregado correctamente' });
        });
    });
});


//Endpoint para las categorias
app.get('/dibujo-tecnico', checkAuthenticated, (req, res) => {
    res.render('dibujo-tecnico.ejs');
})

app.get('/programacion', checkAuthenticated, (req, res) => {
    res.render('programacion.ejs');
})

app.get('/mecatronica', checkAuthenticated, (req, res) => {
    res.render('mecatronica.ejs');
})

app.get('/sistemas-digitales', checkAuthenticated, (req, res) => {
    res.render('sistemas_digitales.ejs');
})




//Este endpoint sirve para saber los productos por categoria en la base de datos
app.get('/productos-categoria', checkAuthenticated, (req, res) => {

    //console.log(req.query, " typeof: ", typeof req.query);

    if(Object.keys(req.query).length === 0) return res.json({});

    const categoria = req.query.categoria;

    //console.log(categoria);

    const categorias = ["dibujo", "mecatronica", "programacion", "sistemas"];
    
    let isValidParam = false;
    for(it in categorias){
        if(categorias[it] === categoria){
            isValidParam = true;
        }
    }
    
    if(!isValidParam)
        return res.json({});

    const connection = new mysql_sync({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME 
    });
    
    const queryForIdCategoria = 'SELECT categoria_id FROM categorias WHERE nombre = ?;' //dibujo
    //const categoria = "dibujo";
    
    const resultsOfCategoria = connection.query(queryForIdCategoria, [categoria]);

    console.log(resultsOfCategoria);

    const idCategoria = resultsOfCategoria[0].categoria_id;

    console.log(idCategoria, " type: ", typeof idCategoria);
    //const queryForIdCategoria = 'SELECT categoria_id FROM categorias WHERE nombre = ?;' //dibujo

    const queryForProducts = 'SELECT * FROM productos WHERE categoria_id = ?;'

    const resultOfProducts = connection.query(queryForProducts, [idCategoria]);
    
    console.log(resultOfProducts);

    const listOfProducts = resultOfProducts;

    console.log("This is the for");

    for(it in listOfProducts){
        console.log(listOfProducts[it]);
    }
    
    res.json(
        listOfProducts
    );
});



//Endpoint para mostar las imagenes
app.get('/showImage/:nombre', checkAuthenticated, (req, res) => {
    const nombreImagen = req.params.nombre;

    //console.log(id);
    console.log(__dirname, './uploads');

    let imageExists = false;

    const files = fs.readdirSync('./uploads/');
    console.log(files);

    for (it in files){

        console.log(files[it]);

        if(files[it] === nombreImagen){
            console.log(files[it], nombreImagen);
            imageExists = true;
        }
    }

    console.log(imageExists);

    if(imageExists){
        const pathOfImage = __dirname + '/uploads/' + nombreImagen;
        console.log(pathOfImage, typeof pathOfImage);
        res.sendFile(
            pathOfImage
        );
        //res.send("Si esta la imagen")
    } else {
        const noImageRoute = __dirname + '/uploads/noImageFound.jpg'
        res.sendFile(
            noImageRoute
        );
        //res.send("No existe la imagen");
    }

});






//Endpoint para lo relacionado para con el carrito de compra
app.get('/carrito-compra', checkAuthenticated, (req, res) => {
	res.render('carrito-compra.ejs');
});

app.post('/carrito-compra', checkAuthenticated, (req, res) => {
    console.log(req.head, typeof req.head)
    console.log(req.body, typeof req.body)

    const idProductoStr = req.body.producto_id;
    console.log(idProductoStr, typeof idProductoStr);

    idProducto = parseInt(idProductoStr);

    console.log (idProducto);


    res.render('carrito-compra.ejs');
	
});


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
