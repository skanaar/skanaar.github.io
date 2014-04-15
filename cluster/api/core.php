<?php
class Config {
	const connection = 'mysql:host=localhost;port=3306;dbname=cluster';
}

class Session {
	static function set($value){ $_SESSION['username'] = $value; }
	static function isActive(){ return isset($_SESSION['username']); }
	static function get(){ return $_SESSION['username']; }
	static function end(){ unset($_SESSION['username']); }
}

class Crypto {
	static function salt(){ return md5(rand() . microtime()); }
	static function hash($password, $salt){ return md5($password . $salt); }
}

class Storage {
	protected $pdo;
	function __construct() {
		$this->pdo = new PDO(Config::connection, 'root', '');
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