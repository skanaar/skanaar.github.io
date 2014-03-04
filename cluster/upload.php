<?php
if ($_POST["key"] == "93jdv74"){
	$email = file_get_contents("data/adminemail.txt");
	$message = stripslashes($_POST["message"]);
	$subject = $_POST["subject"];
	mail($email, $subject, $message);
	echo "success";
} else {
	echo "failure";
}
