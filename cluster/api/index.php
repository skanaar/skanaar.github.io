<?php
require_once __DIR__ . '/core.php';

function fail($msg){
	http_response_code(400);
	echo $msg;
}

function isSuperUser($name){
	return $name == 'apa';
}

session_start();
if (!isset($_REQUEST['action'])){
	fail('no action specified');
	exit();
}
$action = $_REQUEST['action'];

try {

	if ($action == 'send_message'){
		if (Session::isActive()){
			require 'class.phpmailer.php';
			$mail = new PHPMailer();
			$mail->addAddress(file_get_contents('../data/adminemail.txt'));
			$mail->Subject = $_POST['subject'];
			$mail->Body = stripslashes($_POST['message']);
			if (isset($_POST['data']) && $_POST['data'] != ''){
		    	$mail->addStringAttachment(stripslashes($_POST['data']), 'data.json');
			}
			if (!$mail->send()) {
				fail('failure ' . $mail->ErrorInfo);
			} else {
				echo 'success';
			}
		}
		else
			fail('did not authenticate');
	}

	if ($action == 'store_settings'){
		$payload = $_REQUEST['payload'];
		if (Session::isActive()){
			$dao = new SettingsStorage();
			$dao->write(Session::get(), $payload);
			echo 'write complete';
		}
		else
			fail('did not authenticate');
	}

	if ($action == 'read_settings'){
		$dao = new SettingsStorage();
		echo $dao->read($_REQUEST['username']);
	}

	if ($action == 'new_account'){
		if (isSuperUser(Session::get())){
			$dao = new AccountStorage();
			$dao->create($_REQUEST['username'], $_REQUEST['password'], $_REQUEST['email']);
			echo 'account created';
		} else
			fail('insufficient privileges');
	}

	if ($action == 'assign_password'){
		if (isSuperUser(Session::get())){
			$dao = new AccountStorage();
			$account = $dao->get($_REQUEST['username']);
			$hash = Crypto::hash($_REQUEST['password'], $account['salt']);
			$dao->changePassword($_REQUEST['username'], $hash);
			echo 'password changed';
		} else
			fail('insufficient privileges');
	}

	if ($action == 'change_password'){
		$dao = new AccountStorage();
		$account = $dao->get($_REQUEST['user']);
		$hash = Crypto::hash($_REQUEST['password'], $account['salt']);
		$newHash = Crypto::hash($_REQUEST['new_password'], $account['salt']);
		if ($hash == $account['passwordHash']){
			$dao->changePassword($account['username'], $newHash);
			echo 'password changed';
		}
		else
			fail('did not authenticate');
	}

	if ($action == 'start_session'){
		$dao = new AccountStorage();
		$account = $dao->get($_REQUEST['user']);
		$hash = Crypto::hash($_REQUEST['password'], $account['salt']);
		if ($account['passwordHash'] == $hash) {
			Session::set($_REQUEST['user']);
			echo 'success';
		} else 
			fail('failure');
	}

	if ($action == 'end_session'){
		Session::end();
		echo 'session terminated';
	}

	if ($action == 'get_session'){
		echo Session::get();
	}

} catch (Exception $e) {
	fail('failure');
}