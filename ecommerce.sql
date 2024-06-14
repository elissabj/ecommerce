create database e_commerce_germain;
use e_commerce_germain;

create table usuarios(
usuario_id int auto_increment primary key,
usuario varchar(50) not null unique,
correo varchar(100) not null unique,
contra varchar(250) not null,
role ENUM('vendedor','comprador') not null
);

create table categorias(
categoria_id int auto_increment primary key,
nombre varchar(100) not null unique
);

create table productos(
producto_id int auto_increment primary key,
nombre varchar(250) not null,
precio decimal(10,2) not null,
cantidad int not null,
categoria_id int,
vendedor_id int,
foreign key (categoria_id) references categorias(categoria_id),
foreign key (vendedor_id) references usuarios(usuario_id),
nombre_imagen VARCHAR (250)
);

create table carritos(
carrito_id int auto_increment primary key,
usuario_id int, 
foreign key (usuario_id) references usuarios(usuario_id)
);


create table elementos_carrito (
    elementos_carrito_id INT AUTO_INCREMENT PRIMARY KEY,
    carrito_id INT,
    FOREIGN KEY (carrito_id) REFERENCES carritos(carrito_id),
    productos_comprados json,
    precio_total DECIMAL(10,2) NOT NULL
);

insert into categorias (nombre) values ('dibujo');
insert into categorias (nombre) values ('programacion');
insert into categorias (nombre) values ('mecatronica');
insert into categorias (nombre) values ('sistemas');