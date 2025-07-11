create database oldgoal;
use oldgoal;

create table if not exists usuario (
    id int auto_increment primary key,
    nome varchar(255),
    genero enum('homem', 'mulher'),
    data_nascimento date,
    email varchar(45) unique,
    senha varchar(45)
);

create table refeicao (
    id int auto_increment primary key,
    usuario_id int not null,
    nome varchar(100) not null,
    horario time not null,
    icone varchar(50),
    foreign key (usuario_id) references usuario(id) on delete cascade
);

create table alimento (
    id int auto_increment primary key,
    refeicao_id int not null,
    nome varchar(100) not null,
    quantidade varchar(50),
    calorias int not null,
    foreign key (refeicao_id) references refeicao(id) on delete cascade
);

create table refeicao_usuario (
    id int auto_increment primary key,
    usuario_id int not null,
    refeicao_id int not null,
    data date not null,
    concluida boolean default false,
    foreign key (usuario_id) references usuario(id) on delete cascade,
    foreign key (refeicao_id) references refeicao(id) on delete cascade
);