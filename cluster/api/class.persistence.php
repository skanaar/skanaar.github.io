<?php
//require_once __DIR__ . '/exceptions/class.OrderException.php';

class Persistence {
	private $pdo = null;

	/**
	 * @param int $steamid
	 * @param int $appid
	 * @param string $county
	 * @param string $currency
	 * @param array $items
	 */
	public function Create($steamid, $appid, $county, $currency, array $items) {
		$itemTypes = array();
		foreach ($items as $item) {
			$itemTypes[] = $item->getItemType();
		}

		$itemsSerialization = implode(',', $itemTypes);

		$pdo = $this->GetDatabaseConnection();
		$statement = $pdo->prepare('INSERT INTO orders (steamid, appid, country, currency, itemTypes) VALUES (:steamid, :appid, :country, :currency, :itemTypes)');
		$statement->bindParam(':steamid', $steamid);
		$statement->bindParam(':appid', $appid);
		$statement->bindParam(':country', $county);
		$statement->bindParam(':currency', $currency);
		$statement->bindParam(':itemTypes', $itemsSerialization);
		$statement->execute();
		return $pdo->lastInsertId();
	}

	/**
	 * @param $orderid
	 */
	public function Complete($orderid) {
		$pdo = $this->GetDatabaseConnection();
		$statement = $pdo->prepare('UPDATE orders SET isOpen = 0 WHERE id = :orderid');
		$statement->bindParam(':orderid', $orderid);
		$statement->execute();
	}

	/**
	 * @param int $orderid
	 * @return Order
	 */
	public function GetOpenOrder($orderid) {
		$pdo = $this->GetDatabaseConnection();
		$statement = $pdo->prepare('SELECT * FROM orders WHERE id = :orderid');
		$statement->bindParam(':orderid', $orderid);
		$statement->execute();
		$row = $statement->fetch(PDO::FETCH_ASSOC);

		if ($row == false)
			throw new OrderException("No order was found with id=[$orderid]");

		if (!$row['isOpen'])
			throw new OrderException("Order number [$orderid] was already closed");

		$items = self::commaDelimitedStringToArrayOfNumbers($row);
		return new Order((int)$row['id'], (int)$row['steamid'], (int)$row['appid'], $row['country'], $row['currency'], $items);
	}

	private static function commaDelimitedStringToArrayOfNumbers($row) {
		$numbers = array();
		foreach (explode(',', $row['itemTypes']) as $stringNumber) {
			$numbers[] = (int)$stringNumber;
		}
		return $numbers;
	}

	/**
	 * @return PDO
	 */
	private function GetDatabaseConnection() {
		if ($this->pdo != null) return $this->pdo;
		$this->pdo = new PDO('mysql:host=localhost;port=3306;dbname=cluster', 'root', '');
		$this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		return $this->pdo;
	}
}