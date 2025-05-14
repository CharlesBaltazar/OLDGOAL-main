create database oldgoal;
use oldgoal;

create table usuario (
id int auto_increment primary key,
nome varchar (255),
genero enum("homem", "mulher"),
idade int,
email varchar(45),
senha varchar (45)
);

create table nutricionista (
id int auto_increment primary key,
nome varchar (255),
telefone int,
cpf varchar(11)
);

create table alimento (
id int auto_increment primary key,
nome varchar (45),
categoria enum ("carboidrato", "proteína", "lipídio")
);
