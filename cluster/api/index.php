<?php
require_once __DIR__ . '/core.php';

session_start();

if (isset($_REQUEST['store_settings'])){
	$payload = $_REQUEST['payload'];
	if (Auth::isInSession()){
		$dao = new SettingsStorage();
		$dao->write(Session::get(), $payload);
		echo 'write complete';
	}
	else
		echo 'did not authenticate ';
}

if (isset($_REQUEST['read_settings'])){
	$dao = new SettingsStorage();
	echo $dao->read($_REQUEST['username']);
}

if (isset($_REQUEST['show_user'])){
	$p = new AccountStorage();
	try {
		print_r($p->get($_REQUEST['show_user']));
	} catch (Exception $e) {
		echo 'no user found';
	}
}

if (isset($_REQUEST['new_account'])){
	try {
		if (Auth::isSuperUser(Session::get())){
			$dao = new AccountStorage();
			$dao->create($_REQUEST['username'], $_REQUEST['password'], $_REQUEST['email']);
			echo 'account created';
		} else
			echo 'insufficient privileges';
	} catch (Exception $e) {
		echo 'failure';
	}
}

if (isset($_REQUEST['assign_password'])){
	try {
		if (Auth::isSuperUser(Session::get())){
			$dao = new AccountStorage();
			$account = $dao->get($_REQUEST['username']);
			$hash = Crypto::hash($_REQUEST['password'], $account['salt']);
			$dao->changePassword($_REQUEST['username'], $hash);
			echo 'password changed';
		} else
			echo 'insufficient privileges';
	} catch (Exception $e) {
		echo 'failure';
	}
}

if (isset($_REQUEST['change_password'])){
	try {
		$dao = new AccountStorage();
		$account = $dao->get($_REQUEST['user']);
		$hash = Crypto::hash($_REQUEST['password'], $account['salt']);
		$newHash = Crypto::hash($_REQUEST['new_password'], $account['salt']);
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

if (isset($_REQUEST['start_session'])){
	if (Auth::authenticated($_REQUEST['user'], $_REQUEST['password'])) {
		Session::set($_REQUEST['user']);
		echo 'session started';
	} else {
		echo 'did not authenticate';
	}
}

if (isset($_REQUEST['end_session'])){
	Session::end();
	echo 'session terminated';
}

if (isset($_REQUEST['get_session'])){
	echo Session::get();
}
