/*
Usuario tabla 

*id (auto increment) → consultar si vende o compra 
*username 
*correo
password (opcional) 
rol  ENUM (‘comprador’, ‘vendedor’)
*/

create database ecommerce;
use ecommerce;

create table usuarios (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR (100) NOT NULL UNIQUE,
    contra VARCHAR (255) NOT NULL, /*OPCIONAL*/
    role ENUM('vendedor', 'comprador') NOT NULL
); 


/*
Producto 
*id (auto increment)
*nombre : 
*costo_unitario : 
*cantidad : 
++++ id_usuario (quien lo vende) foranea 
descripcion (opcional) 
img (opcional) 
categoria (opcional) 
*/

create table productos (
    producto_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(250) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL, 
    categoria_id INT,
    vendedor_id INT, 
    FOREIGN KEY (categoria_id) REFERENCES categorias(categoria_id),
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(usuario_id)
);

ALTER TABLE productos ADD nombre_imagen VARCHAR (250);

/*
Categoria
id - nombre 
1  - matematicas
2  - biologia
3  - quimica
4  - ingles
5  - fisica
6  - dibujo tecnico
7  - varios
*/

create table categorias(
    categoria_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);


/*
Carrito 
*id
+++++ id_usuario foranea

1:1
+++++++++++++ 1 usuario puede tener 1 carrito ++++++++

me va a decir cuantos carritos hay en mi plataforma en total 
*/
create table carritos(
    carrito_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
);

/*
Elemetos carrito
*id
+++++++++id_carrito foranea 
+++++++++id_productos foranea 
*cantidad (<= cantidad del id_prod va en el backend) 
total saldra de la consulta de id_prod* esta nueva cantidad


+++++++++++ 1 carrito tiene muchos elementos dentro del mismo 
1 : N de carrito a los elementos que hay en el carrito

+++++++++++ puedo comprar N productos X cantidad x producto) 
N prod                                  X cantidad
crema de cara                               3
chocomilk                                     2
jamon                                            1
queso                                             4

N:X 
N:N 
*/
create table elementos_carrito (
    elementos_carrito_id INT AUTO_INCREMENT PRIMARY KEY,
    carrito_id INT,
    producto_id INT,
    cantidad INT NOT NULL, 
    FOREIGN KEY (carrito_id) REFERENCES carritos(carrito_id),
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id)
);


/*
Pedidos en general cuantos hay
*/

create table pedidos(
    pedido_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pendiente', 'pagado', 'entregado', 'cancelado') NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
);

/*
Especificacion de que se compro por pedido 
*/

create table elementos_pedido (
    elementos_pedido_id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    producto_id INT,
    cantidad INT NOT NULL, 
    precio DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(pedido_id),
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id)
);



insert into categorias (nombre) values ('dibujo');
insert into categorias (nombre) values ('programacion');
insert into categorias (nombre) values ('mecatronica');
insert into categorias (nombre) values ('sistemas');


