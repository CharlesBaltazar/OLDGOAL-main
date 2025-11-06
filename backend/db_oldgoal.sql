create database oldgoal;
use oldgoal;

-- Usuário
create table if not exists usuario (
    id int auto_increment primary key,
    nome varchar(255),
    genero enum('homem', 'mulher'),
    data_nascimento date,
    email varchar(45) unique,
    senha varchar(45),
    bio text,
    role enum('user','admin') not null default 'user'
);

-- Refeição personalizada do usuário (agora com informações dos alimentos integradas)
create table refeicao (
    id int auto_increment primary key,
    usuario_id int not null,
    nome varchar(100) not null,
    horario time not null,
    icone varchar(50), -- nome do ícone ou caminho
    alimentos_json text, -- JSON com lista de alimentos: [{"nome":"Arroz","quantidade":"200g","calorias":300}]
    total_calorias int default 0,
    foreign key (usuario_id) references usuario(id) on delete cascade
);

-- Marca refeições concluídas por usuário e data
create table refeicao_usuario (
    id int auto_increment primary key,
    usuario_id int not null,
    refeicao_id int not null,
    data date not null,
    concluida boolean default false,
    foreign key (usuario_id) references usuario(id) on delete cascade,
    foreign key (refeicao_id) references refeicao(id) on delete cascade
);

select * from usuario;