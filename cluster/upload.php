<?php
if ($_POST["key"] == "ofd38sd"){
	require 'class.phpmailer.php';
	$mail = new PHPMailer();
	$mail->addAddress(file_get_contents("data/adminemail.txt"));
	$mail->Subject = $_POST["subject"];
	$mail->Body = stripslashes($_POST["message"]);
    $mail->addStringAttachment(stripslashes($_POST["data"]), 'data.json');
	if (!$mail->send()) {
		echo "failure" . $mail->ErrorInfo;
	} else {
		echo "success";
	}
} else if ($_POST["key"] == "93jdv74"){
	$email = file_get_contents("data/adminemail.txt");
	$message = stripslashes($_POST["message"]);
	$subject = $_POST["subject"];
	mail($email, $subject, $message);
	echo "success";
} else {
	echo "failure";
}
