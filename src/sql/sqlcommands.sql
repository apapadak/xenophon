
-- ************************************************
--  DROP ALL TABLES, SEQUENCES, TRIGGERS
-- ************************************************

DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- ************************************************
--  Users table
-- ************************************************


CREATE TABLE users (
	user_id		SERIAL PRIMARY KEY,
	afm         VARCHAR(255) UNIQUE NOT NULL,
	mhtrwo      VARCHAR(255) UNIQUE NOT NULL,
	password    VARCHAR(255) NOT NULL,
	firstname   VARCHAR(255),
	surname     VARCHAR(255),
	father_name VARCHAR(255),
	tax_office  VARCHAR(255),
	dob			    DATE,
	adt			    VARCHAR(255),
	iban		    VARCHAR(255),
	bank        VARCHAR(255),
	legal_form  VARCHAR(255),

	address     VARCHAR(255),
	city        VARCHAR(255),
	postal_code VARCHAR(255),
	country     VARCHAR(255),
	telephone   VARCHAR(255),
	mobile      VARCHAR(255),
	email_1     VARCHAR(255),
	email_2     VARCHAR(255),

	created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);


--
--	Extra tables
--


CREATE TABLE claims_titles_papers (
	id		 				SERIAL PRIMARY KEY,
	title					VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_titles_papers_extra (
	id		 				SERIAL PRIMARY KEY,
	title_extra				VARCHAR(255) NOT NULL
);

CREATE TABLE claims_titles_internet (
	id		 				SERIAL PRIMARY KEY,
	title					VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_titles_internet_extra (
	id		 				SERIAL PRIMARY KEY,
	title_extra				VARCHAR(255) NOT NULL
);

CREATE TABLE claims_titles_tv (
	id		 				SERIAL PRIMARY KEY,
	title					VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_titles_tv_extra (
	id		 				SERIAL PRIMARY KEY,
	title_extra				VARCHAR(255) NOT NULL
);

CREATE TABLE claims_titles_radio (
	id		 				SERIAL PRIMARY KEY,
	title					VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_titles_radio_extra (
	id		 				SERIAL PRIMARY KEY,
	title_extra				VARCHAR(255) NOT NULL
);


CREATE TABLE claims_paper_types (
	id 			SERIAL PRIMARY KEY,
  type  VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_internet_types (
  id    SERIAL PRIMARY KEY,
  type  VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_tv_types (
	id 			SERIAL PRIMARY KEY,
	type        VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_radio_types (
	id 			SERIAL PRIMARY KEY,
	type        VARCHAR(255) UNIQUE NOT NULL
);


CREATE TABLE claims_periodicities (
	id 			SERIAL PRIMARY KEY,
	periodicity VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_roles (
	id 			SERIAL PRIMARY KEY,
	role		VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_wordcounts (
	id 			SERIAL PRIMARY KEY,
	wordcount	VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_circulations (
	id 			SERIAL PRIMARY KEY,
	circulation VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE claims_pageviews (
  id          SERIAL PRIMARY KEY,
  pageviews VARCHAR(255) UNIQUE NOT NULL
);


--
--	Main claims tables
--

--	Main claims PAPER

CREATE TABLE claims_paper (
	id 		 						SERIAL PRIMARY KEY,
	user_id							INT,
	signature						VARCHAR(255),
	title_paper_id 					INT,
	title_paper_id_extra			INT,
	paper_type_id 						INT,
	periodicity_id 					INT,
	role_id						    INT,
	wordcount_id				    INT,
	circulation_id				    INT,
	finalFlag						BOOLEAN DEFAULT FALSE,

  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP WITH TIME ZONE,

  finalized_at  TIMESTAMP WITH TIME ZONE,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (title_paper_id) REFERENCES claims_titles_papers(id),
    FOREIGN KEY (title_paper_id_extra) REFERENCES claims_titles_papers_extra(id),
    FOREIGN KEY (paper_type_id) REFERENCES claims_paper_types(id),
    FOREIGN KEY (periodicity_id) REFERENCES claims_periodicities(id),

	FOREIGN KEY (role_id) REFERENCES claims_roles(id),
	FOREIGN KEY (wordcount_id) REFERENCES claims_wordcounts(id),
	FOREIGN KEY (circulation_id) REFERENCES claims_circulations(id)
);


-- Create the trigger function
CREATE OR REPLACE FUNCTION delete_related_titles_papers_extra()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM claims_titles_papers_extra
    WHERE id = OLD.title_paper_id_extra;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER delete_title_paper_extra
AFTER DELETE ON claims_paper
FOR EACH ROW
EXECUTE FUNCTION delete_related_titles_papers_extra();

--	Main claims INTERNET

CREATE TABLE claims_internet (
	id 		 						SERIAL PRIMARY KEY,
	user_id							INT,
	signature						VARCHAR(255),
	title_internet_id 				INT,
	title_internet_id_extra			INT,
	internet_type_id 						INT,
	periodicity_id 					INT,
	role_id						    INT,
	wordcount_id				    INT,
  pageviews_id					    INT,
  finalFlag						BOOLEAN DEFAULT FALSE,

  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP WITH TIME ZONE,

  finalized_at  TIMESTAMP WITH TIME ZONE,

	FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (title_internet_id) REFERENCES claims_titles_internet(id),
    FOREIGN KEY (title_internet_id_extra) REFERENCES claims_titles_internet_extra(id),
    FOREIGN KEY (internet_type_id) REFERENCES claims_internet_types(id),
    FOREIGN KEY (periodicity_id) REFERENCES claims_periodicities(id),

	FOREIGN KEY (role_id) REFERENCES claims_roles(id),
	FOREIGN KEY (wordcount_id) REFERENCES claims_wordcounts(id),
	FOREIGN KEY (pageviews_id) REFERENCES claims_pageviews(id)
);

-- Create the trigger function
CREATE OR REPLACE FUNCTION delete_related_titles_internet_extra()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM claims_titles_internet_extra
    WHERE id = OLD.title_internet_id_extra;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER delete_title_internet_extra
AFTER DELETE ON claims_internet
FOR EACH ROW
EXECUTE FUNCTION delete_related_titles_internet_extra();


--	Main claims TV

-- Kanali/Tv Station
-- Eidos : Eidiseis/ Ekpobi/ Ntokumantair
-- Periodikotita:: Lista : Sbinoume diminiaia, triminiaia, 6miniaia, etisia
-- Idiotita: Ola
-- Arithmos Leksewn, Mesi tiletheasi inactive

CREATE TABLE claims_tv (
	id 		 						SERIAL PRIMARY KEY,
	user_id							INT,
	signature						VARCHAR(255),
	title_tv_id 					INT,
	title_tv_id_extra				INT,
	tv_type_id 						INT,
	periodicity_id 					INT,
	role_id						    INT,
	wordcount    				    INT,
	circulation					    INT,
  finalFlag						BOOLEAN DEFAULT FALSE,

  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP WITH TIME ZONE,

  finalized_at TIMESTAMP WITH TIME ZONE,

	FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (title_tv_id) REFERENCES claims_titles_tv(id),
    FOREIGN KEY (title_tv_id_extra) REFERENCES claims_titles_tv_extra(id),
    FOREIGN KEY (tv_type_id) REFERENCES claims_tv_types(id),
    FOREIGN KEY (periodicity_id) REFERENCES claims_periodicities(id),

	FOREIGN KEY (role_id) REFERENCES claims_roles(id)
	--FOREIGN KEY (wordcount_id) REFERENCES claims_wordcounts(id),
	--FOREIGN KEY (circulation_id) REFERENCES claims_circulations(id)
);

-- Create the trigger function
CREATE OR REPLACE FUNCTION delete_related_titles_tv_extra()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM claims_titles_tv_extra
    WHERE id = OLD.title_tv_id_extra;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER delete_title_tv_extra
AFTER DELETE ON claims_tv
FOR EACH ROW
EXECUTE FUNCTION delete_related_titles_tv_extra();

--	Main claims RADIO

-- R/F stathmos
-- Eidos : Eidiseis / Ekpobi / Podcast
-- Periodikotita:: Lista : Sbinoume diminiaia, triminiaia, 6miniaia, etisia
-- Idiotita: Ola
-- Arithmos Leksewn, Mesi akroamatikotita inactive

CREATE TABLE claims_radio (
	id 		 						SERIAL PRIMARY KEY,
	user_id							INT,
	signature						VARCHAR(255),
	title_radio_id 					INT,
	title_radio_id_extra			INT,
	radio_type_id 					INT,
	periodicity_id 					INT,
	role_id						    INT,
	wordcount    				    INT,
	circulation					    INT,
  finalFlag						BOOLEAN DEFAULT FALSE,

  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP WITH TIME ZONE,

  finalized_at  TIMESTAMP WITH TIME ZONE,

	FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (title_radio_id) REFERENCES claims_titles_radio(id),
    FOREIGN KEY (title_radio_id_extra) REFERENCES claims_titles_radio_extra(id),
    FOREIGN KEY (radio_type_id) REFERENCES claims_radio_types(id),
    FOREIGN KEY (periodicity_id) REFERENCES claims_periodicities(id),

	FOREIGN KEY (role_id) REFERENCES claims_roles(id)
	--FOREIGN KEY (wordcount_id) REFERENCES claims_wordcounts(id),
	--FOREIGN KEY (circulation_id) REFERENCES claims_circulations(id)
);

-- Create the trigger function
CREATE OR REPLACE FUNCTION delete_related_titles_radio_extra()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM claims_titles_radio_extra
    WHERE id = OLD.title_radio_id_extra;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER delete_title_radio_extra
AFTER DELETE ON claims_radio
FOR EACH ROW
EXECUTE FUNCTION delete_related_titles_radio_extra();



--
--  ALTER TABLE users ADD COLUMN admin BOOLEAN DEFAULT false;
--  UPDATE users SET admin = false;
--
--
--





