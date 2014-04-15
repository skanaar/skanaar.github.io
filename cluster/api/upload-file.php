<?php
require_once __DIR__ . '/core.php';
?><!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>File upload</title>
	<link rel="stylesheet" href="../css/cluster.css">
	<style>
	html, body { background-color: #eee; overflow-y: hidden; }
	h2 { margin: 0 }
	input[type=file] { width: 60% }
	</style>
</head>
<body>

<?php
if ( !isset($_FILES['userFile']['type']) ) {
?>
<form action="upload-file.php" method="post" enctype="multipart/form-data">
	<input type="file" name="userFile" id="userFile"/>
	<input type="submit" value="Upload File" />
</form>
<?php
} else {
	echo '<h2>';
	if ( !($handle = fopen ($_FILES['userFile']['tmp_name'], "r")) ) {
		echo 'Could not upload file';
	} else if ( !($image = fread($handle, filesize($_FILES['userFile']['tmp_name']))) ) {
    	echo 'Could not upload file';
	} else {
	   fclose ($handle);
	   // Commit image to the database

	    try {
			if (Session::isActive()){
				$dao = new ImageStorage();
				$dao->write(Session::get(), $_FILES['userFile']['type'], $image);
				echo 'File uploaded';
			}
			else
				echo 'did not authenticate';
	    } catch (Exception $e){
	    	echo 'Could not upload file';
	    }
	}
	echo '</h2>';
}
?>
</body>
</html>