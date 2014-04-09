<?php

session_start();
class Session {
	static function set($value){ $_SESSION['username'] = $value; }
	static function get(){ return $_SESSION['username']; }
	static function end(){ unset($_SESSION['username']); }
}

class Crypto {
	static function salt(){ return md5(rand() . microtime()); }
	static function hash($password, $salt){ return md5($password . $salt); }
}

class Auth {
	static function isInSession(){
		return isset($_SESSION['username']);
	}
	static function authenticated($user, $password){
		try {
			$dao = new AccountStorage();
			$account = $dao->get($user);
			$hash = Crypto::hash($password, $account['salt']);
			return ($account['passwordHash'] == $hash) ? $account : false;
		} catch (Exception $e) {
			return false;
		}
	}
}

class Storage {
	protected $pdo;
	function __construct() {
		$connString = 'mysql:host=localhost;port=3306;dbname=cluster';
		$this->pdo = new PDO($connString, 'root', '');
		$this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
}

class AccountStorage extends Storage {
	function get($user) {
		$q = 'SELECT * FROM users WHERE email = :user OR username = :user';
		$s = $this->pdo->prepare($q);
		$s->bindParam(':user', $user);
		$s->execute();
		$row = $s->fetch(PDO::FETCH_ASSOC);
		if ($row == false)
			throw new Exception("No account found with username or email [$user]");
		return $row;
	}

	function create($username, $password, $email) {
		$salt = Crypto::salt();
		$passwordHash = Crypto::hash($password, $salt);

		$q = 'INSERT INTO users (username, email, passwordHash, salt) '.
			 'VALUES (:user, :mail, :pass, :salt)';
		$s = $this->pdo->prepare($q);
		$s->bindParam(':user', $username);
		$s->bindParam(':mail', $email);
		$s->bindParam(':pass', $passwordHash);
		$s->bindParam(':salt', $salt);
		$s->execute();
	}

	function changePassword($username, $passwordHash) {
		$q = 'UPDATE users SET passwordHash = :pass WHERE username = :user';
		$s = $this->pdo->prepare($q);
		$s->bindParam(':user', $username);
		$s->bindParam(':pass', $passwordHash);
		$s->execute();
	}
}

class BlobStorage extends Storage {
	protected $key = 'null';

	function read($username) {
		$q = 'SELECT data FROM blobs WHERE username = :user AND blobs.key = :key';
		$s = $this->pdo->prepare($q);
		$s->bindParam(':user', $username);
		$s->bindParam(':key', $this->key);
		$s->execute();
		$row = $s->fetch(PDO::FETCH_ASSOC);
		if ($row == false)
			throw new Exception("No [".$this->key."] were found for [$user]");
		return $row['data'];
	}

	function write($username, $data) {
		$q = 'INSERT INTO blobs (username, blobs.key, data) '.
			 'VALUES (:user, :key, :data) '.
			 'ON DUPLICATE KEY UPDATE data = :data';
		$s = $this->pdo->prepare($q);
		$s->bindParam(':user', $username);
		$s->bindParam(':key', $this->key);
		$s->bindParam(':data', $data);
		$s->execute();
	}
}

class SettingsStorage extends BlobStorage {
	protected $key = 'settings';
}

if (isset($_GET['store_settings'])){
	$payload = $_GET['payload'];
	if (Auth::isInSession()){
		$dao = new SettingsStorage();
		$dao->write(Session::get(), $payload);
		echo 'write complete';
	}
	else
		echo 'did not authenticate ';
}

if (isset($_GET['read_settings'])){
	if (Auth::isInSession()){
		$dao = new SettingsStorage();
		echo $dao->read(Session::get());
	}
	else
		echo 'did not authenticate ';
}

if (isset($_GET['show_user'])){
	$p = new AccountStorage();
	try {
		print_r($p->get($_GET['show_user']));
	} catch (Exception $e) {
		echo 'no user found';
	}
}

if (isset($_GET['new_account'])){
	try {
		$dao = new AccountStorage();
		$dao->create($_GET['username'], $_GET['password'], $_GET['email']);
	} catch (Exception $e) {
		echo 'failure';
	}
}

if (isset($_GET['change_password'])){
	try {
		$dao = new AccountStorage();
		$account = $dao->get($_GET['user']);
		$hash = Crypto::hash($_GET['password'], $account['salt']);
		$newHash = Crypto::hash($_GET['new_password'], $account['salt']);
		if ($hash == $account['passwordHash']){
			$dao->changePassword($account['username'], $newHash);
			echo 'password changed';
		}
		else
			echo 'did not authenticate ';
	} catch (Exception $e) {
		echo 'no user found';
	}
}

if (isset($_GET['start_session'])){
	if (Auth::authenticated($_GET['user'], $_GET['password'])) {
		Session::set($_GET['user']);
		echo 'session started';
	} else {
		echo 'did not authenticate';
	}
}

if (isset($_GET['end_session'])){
	Session::end();
}

if (isset($_GET['get_session'])){
	echo Session::get();
}
