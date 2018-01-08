<?php

// Connecting to databse using helper package
// Importing the FPDF library tool file
//require_once('fpdf17/fpdf.php');
//require_once('fpdf17/mem_image.php');
require_once('tcpdf62/tcpdf.php');

// Class that extends FPDF package and generates the output PDF file
class PDF extends TCPDF {

    // Load data
    function loadData($file) {
        // Read file lines
        $lines = file($file);
        $data = array();
        foreach ($lines as $line)
            $data[] = explode(';', trim($line));
        return $data;
    }

    // Page header
    function Header() {
        // Logo
        //$this->Image('logo.png', 15, 10, 180); // X, Y, Width, Height
        //$this->Ln(40);
    }

    // Page footer
    function Footer() {
        // Position at 1.5 cm from bottom
        $this->SetY(-15);
        // Font 8
        $this->SetFont('pdfahelvetica', '', 8);
//        // Footer note
//        $this->Write(0, '');
//        $this->Ln();
        // Page number
        $this->Cell(0, 10, date("d.m.Y") . ' - page ' . $this->PageNo() . '/' . $this->getAliasNbPages(), 0, 0, 'C');
    }

    // Generate form
    function Generate($db, $params) {

        // Settings
        $h = 5;
        $s = 9;
        $fontName = 'dejavusans';
        
        // Company code prefix
        $comp_code = "";
        if (array_key_exists("code", $params) && strlen($params["code"]) > 0) {
            $comp_code = $params["code"];
        }

        // Language code
        $lang_code = "";
        if (array_key_exists("language", $params) && strlen($params["language"]) > 0) {
            $lang_code = $params["language"];
            if ($lang_code === 'ar' || $lang_code === 'iw') {
                $this->setRTL(true);
            }
        }

        // Parameters info
        $sql = "SELECT * FROM " . $comp_code . "parameter_entry"; //WHERE group_id LIKE '4%'";
        //echo "$sql;</br>";
        $result3 = $db->query($sql);
        //print_r($result3);
        $parameters = array();
        if (is_object($result3)) {
            while ($row = $result3->fetch_array(MYSQLI_ASSOC)) {
                $parameters[$row["id"]] = $row;
                $parameters[$row["id"]]["value"] = Tools::getParamLocale($parameters[$row["id"]]["value"], $lang_code);
                $parameters[$row["id"]]["description"] = Tools::getParamLocale($parameters[$row["id"]]["description"], $lang_code);
            }
            //print_r($parameters);
            //echo "</br>count: " . count($parameters) . "</br></br>";
        }

        // Logo
        try {
            if (array_key_exists("104007", $parameters)) {
                if ($parameters["104007"]["file"] !== null && strlen($parameters["104007"]["file"]) > 100) {
                    $this->Image('@' . base64_decode($parameters["104007"]["file"]), $parameters["104003"]["value"], $parameters["104001"]["value"], $parameters["104005"]["value"]); // X, Y, Width, Height
                    if (array_key_exists("104008", $parameters)) {
                        $this->Ln((integer) $parameters["104008"]["value"]);
                    } else {
                        $this->Ln(40);
                    }
                } else {
                    if ($parameters["104007"]["description"] !== 'null' && strlen($parameters["104007"]["description"]) > 0) {
                        $this->SetFont($fontName, 'B', 14); // 'B', 'I', 'U'
                        $this->Cell(180, 0, $parameters["104007"]["description"], 0, 0, 'L');
                        $this->Ln(10);
                    }
                    if ($parameters["104007"]["note"] !== 'null' && strlen($parameters["104007"]["note"]) > 0) {
                        $this->SetFont($fontName, '', 11); // 'B', 'I', 'U'
                        $this->Cell(180, 0, $parameters["104007"]["note"], 0, 0, 'L');
                        $this->Ln(20);
                    }
                }
            }
        } catch (Exception $e) {
            
        }

        // Margins
        if (array_key_exists("104001", $parameters)) {
            $this->SetTopMargin((integer) $parameters["104001"]["value"]);
            $this->Ln((integer) $parameters["104001"]["value"]);
        } else {
            $this->SetTopMargin(20);
            $this->Ln(20);
        }
        if (array_key_exists("104003", $parameters)) {
            $this->SetLeftMargin((integer) $parameters["104003"]["value"]);
        } else {
            $this->SetLeftMargin(15);
        }
        if (array_key_exists("104004", $parameters)) {
            $this->SetRightMargin((integer) $parameters["104004"]["value"]);
        } else {
            $this->SetRightMargin(15);
        }

        // Querying the database
        // Order main info
        $sql = "SELECT * FROM " . $comp_code . "transaction_order WHERE id = " . $params["value"][0];
        //echo "$sql;</br>";
        $result1 = $db->query($sql);
        //print_r($result1);
        $order = array();
        if (is_object($result1)) {
            $order = $result1->fetch_array(MYSQLI_ASSOC);
        }
        if (count($order) <= 0) {
            die("Order ID does not exists!");
        }
        // Currency
        $currency_id = $order["currency_id"];
        if (!array_key_exists($currency_id, $parameters)) {
            $currency_id = $parameters["407003"]["value"];
        }
        $currency_rate = 1.0;
        if (array_key_exists($currency_id, $parameters)) {
            $currency_rate = (double) $parameters[$currency_id]["value"];
        }
        $total_currency_id = "0";
        if (array_key_exists("407008", $parameters)) {
            $total_currency_id = $parameters["407008"]["value"];
        }
        $total_currency_rate = 1.0;
        if (array_key_exists($total_currency_id, $parameters)) {
            $total_currency_rate = (double) $parameters[$total_currency_id]["value"];
        }
        //print_r($order);
        //echo "</br>count: " . count($order) . "</br></br>";
        //
        // Order table info
        $sql = "SELECT * FROM " . $comp_code . "transaction_entry WHERE order_id = " . $params["value"][0] . " ORDER BY id";
        //echo "$sql;</br>";
        $result2 = $db->query($sql);
        //print_r($result2);
        $entries = array();
        if (is_object($result2)) {
            while ($row = $result2->fetch_array(MYSQLI_ASSOC)) {
                array_push($entries, $row);
            }
        }
        //print_r($entries);
        //echo "</br>count: " . count($entries) . "</br></br>";
        //        
        // Recipient info
        $sql = "SELECT * FROM " . $comp_code . "account_company WHERE id = " . $order["company_id"];
        $result4 = $db->query($sql);
        $company = $result4->fetch_array(MYSQLI_ASSOC);
        $sql = "SELECT * FROM " . $comp_code . "account_contact WHERE company_id = " . $order["company_id"];
        $result5 = $db->query($sql);
        $contact = $result5->fetch_array(MYSQLI_ASSOC);
        $sql = "SELECT * FROM " . $comp_code . "account_branch, " . $comp_code . "parameter_entry pe WHERE company_id = " . $order["company_id"] . " AND country_id = pe.id";
        $result6 = $db->query($sql);
        $branch = $result6->fetch_array(MYSQLI_ASSOC);
        $sql = "SELECT * FROM " . $comp_code . "account_coordinate WHERE company_id = " . $order["company_id"];
        $result7 = $db->query($sql);
        $coordinates = array();
        $phone = "";
        $mobile = "";
        $email = "";
        while ($row = $result7->fetch_array(MYSQLI_ASSOC)) {
            $coordinates[$row["type_id"]] = $row;
            if ($row["type_id"] == 208001) {
                $phone = $row["name"];
            }
            if ($row["type_id"] == 208002) {
                $mobile = $row["name"];
            }
            if ($row["type_id"] == 208004) {
                $email = $row["name"];
            }
        }
        // Account balances
        // select currency_id, sum(debit) - sum(credit) as balance from emb01_transaction_journal where company_id = 3 group by currency_id;
        //$sql = "SELECT currency_id, sum(debit) - sum(credit) as balance FROM " . $comp_code . "transaction_journal WHERE company_id = " . $order["company_id"] . " group by currency_id";
        $sql = "SELECT currency_id, sum(debit) - sum(credit) as balance FROM " . $comp_code . "transaction_journal WHERE company_id = " . $order["company_id"] . " AND date <= '" . $order["date"] . "' AND order_id != " . $order["id"] . " GROUP BY currency_id";
        $result8 = $db->query($sql);
        $balances_old = array();
        //error_log("count: " . count($result8));
        while ($row = $result8->fetch_array(MYSQLI_ASSOC)) {
            array_push($balances_old, $row);
            //error_log($row["currency_id"] . " " . $row["balance"]);
        }
        $sql = "SELECT currency_id, sum(debit) - sum(credit) as balance FROM " . $comp_code . "transaction_journal WHERE company_id = " . $order["company_id"] . " AND date <= '" . $order["date"] . "' GROUP BY currency_id";
        $result9 = $db->query($sql);
        $balances_new = array();
        //error_log("count: " . count($result9));
        while ($row = $result9->fetch_array(MYSQLI_ASSOC)) {
            array_push($balances_new, $row);
            //error_log($row["currency_id"] . " " . $row["balance"]);
        }

        // Title
        $title = "";
        if (array_key_exists($order["type_id"], $parameters)) {
            $title = $parameters[$order["type_id"]]["name"];
        }
        $this->SetFont($fontName, 'B', 16); // 'B', 'I', 'U'
        $this->Cell(40, 0, $title, 0, 0, 'L'); // 'L', 'C', 'R'
        $this->Ln(10);

        // Recipient info
        $form_type_id = $parameters[$order["type_id"]]["type_id"];
        $form_option_id = $parameters[$order["type_id"]]["option_id"];
        $this->SetFont($fontName, 'B', $s);
        $this->Cell(100, $h, $parameters[$form_option_id]["value"], 0, 0, 'L');
        $this->Cell(40, $h, $parameters["400072"]["value"], 0, 0, 'L');
        $this->Ln();
        $this->SetFont($fontName, '', $s);
        $this->Cell(100, $h, $company["name"], 0, 0, 'L');
        $this->Cell(40, $h, $parameters["400002"]["value"], 0, 0, 'L');
        $this->Cell(40, $h, date("d/m/Y", strtotime($order["date"])), 0, 0, 'L');
        $this->Ln();
        $address_header = explode("\n", $company["note"]);
        if (strlen($branch["address"]) > 0) {
            $this->Cell(100, $h, $branch["address"], 0, 0, 'L');
        } else if (is_array($address_header) && count($address_header) > 0) {
            $this->Cell(100, $h, $address_header[0], 0, 0, 'L');
        }
        $this->Cell(40, $h, $parameters["400004"]["value"], 0, 0, 'L');
        $this->Cell(40, $h, str_pad($order["number"], 4, '0', STR_PAD_LEFT), 0, 0, 'L');
        $this->Ln();
        if (strlen($branch["city"]) > 0) {
            $this->Cell(100, $h, $branch["city"] . ", " . $branch["name"], 0, 0, 'L');
        } else if (is_array($address_header) && count($address_header) > 1) {
            $this->Cell(100, $h, $address_header[1], 0, 0, 'L');
        } else {
            $this->Cell(100, $h, $branch["name"], 0, 0, 'L');
        }
        if ($form_type_id === '409001') { // order
            // tax included/excluded in amounts
            if ($order["tax_id"] === '406002' || $order["tax_id"] === '406003') {
                $this->Cell(40, $h, $parameters["400005"]["value"], 0, 0, 'L');
                $this->Cell(40, $h, $parameters[$order["tax_id"]]["name"], 0, 0, 'L');
            }
        }
        $this->Ln();
        if (strlen($phone) > 0) {
            $this->Cell(100, $h, trim($phone), 0, 0, 'L');
            $this->Ln();
        } else if (is_array($address_header) && count($address_header) > 2) {
            $this->Cell(100, $h, $address_header[2], 0, 0, 'L');
            $this->Ln();
        }
        if (is_array($address_header) && count($address_header) > 3) {
            $this->Cell(100, $h, $address_header[3], 0, 0, 'L');
            $this->Ln();
        }
        $this->Ln();

        // Table column header
        if ($form_type_id === '409001') { // order
            $header = array($parameters["400015"]["value"],
                $parameters["400016"]["value"], $parameters["400017"]["value"],
                $parameters["400019"]["value"], $parameters["400022"]["value"] 
                    . " " . $parameters[$currency_id]["name"]);
            $w = array(25, 80, 20, 25, 30);
            $a = array('L', 'L', 'R', 'R', 'R');
            $label_total = $parameters["400013"]["value"];
        } else if ($form_type_id === '409002') { // voucher
            $header = array($parameters["400081"]["value"], $parameters["400082"]["value"],
                $parameters["400083"]["value"], $parameters["400084"]["value"],
                $parameters["400085"]["value"], $parameters["400086"]["value"],
                $parameters["400087"]["value"] . " " . $parameters[$currency_id]["name"]);
            $w = array(30, 40, 25, 20, 20, 20, 25);
            $a = array('L', 'C', 'C', 'C', 'R', 'C', 'R');
            $label_total = $parameters["400088"]["value"];
        } else {
            $header = array($parameters["400015"]["value"],
                $parameters["400016"]["value"], $parameters["400017"]["value"],
                $parameters["400018"]["value"], $parameters["400019"]["value"],
                $parameters["400022"]["value"] . " " . $parameters[$currency_id]["name"]);
            $w = array(20, 80, 15, 15, 20, 30);
            $a = array('L', 'L', 'C', 'C', 'R', 'R');
            $label_total = $parameters["400013"]["value"];
        }

        // Data loading
        //$data = $this->loadData('countries.txt');
        // Color and font of table header
        $this->SetFillColor(100, 100, 100);
        $this->SetTextColor(255);
        $this->SetLineWidth(.2);
        $this->SetFont($fontName, 'B', $s);
        // Header
        $table_width = 0;
        for ($i = 0; $i < count($header); $i++) {
            $this->Cell($w[$i], $h, $header[$i], 'TB', 0, $a[$i], true);
            $table_width += $w[$i];
        }
        $this->Ln();
        // Color and font of table entries
        $this->SetFillColor(230, 230, 230);
        $this->SetTextColor(0);
        $this->SetFont($fontName, '', $s);
        // Data
        $fill = false;
        $quantity = 0;
        $total = 0;
        //print_r($entries);
        //Cell( $w, $h = 0, $txt = '', $border = 0, $ln = 0, $align = '', $fill = false, $link = '', $stretch = 0, $ignore_min_height = false, $calign = 'T', $valign = 'M' )
        //MultiCell( $w, $h, $txt, $border = 0, $align = 'J', $fill = false, $ln = 1, $x = '', $y = '', $reseth = true, $stretch = 0, $ishtml = false, $autopadding = true, $maxh = 0, $valign = 'T', $fitcell = false )
        if ($form_type_id == 409002) { // voucher
            foreach ($entries as $row) {
                // Type
                if ($row["payment_id"] > 0 && array_key_exists($row["payment_id"], $parameters)) {
                    $this->Cell($w[0], $h, $parameters[$row["payment_id"]]["name"], 0, 0, $a[0], $fill);
                } else {
                    $this->Cell($w[0], $h, "", 0, 0, $a[0], $fill);
                }
                // Number
                $this->Cell($w[1], $h, $row["code"], 0, 0, $a[1], $fill);
                // Date
                $this->Cell($w[2], $h, date("d/m/Y", strtotime($row["date"])), 0, 0, $a[2], $fill);
                // Currency
                if ($row["currency_id"] > 0 && array_key_exists($row["currency_id"], $parameters)) {
                    $this->Cell($w[3], $h, $parameters[$row["currency_id"]]["name"], 0, 0, $a[3], $fill);
                } else {
                    $this->Cell($w[3], $h, "", 0, 0, $a[3], $fill);
                }
                // Price
                $this->Cell($w[4], $h, number_format($row["price"], 2, ".", " "), 0, 0, $a[4], $fill);
                // Quantity
                $quantity = (double) number_format($row["quantity"], 2, ".", "");
                $this->Cell($w[5], $h, $quantity, 0, 0, $a[5], $fill);
                // Amount
                $amount = number_format($row["nettotal"], 2, ".", "");
                $total += $amount;
                $this->Cell($w[6], $h, number_format($amount, 2, ".", " "), 0, 0, $a[6], $fill);
                $this->Ln();
                $fill = !$fill;
            }
        } else {
            foreach ($entries as $row) {
                $this->Cell(array_sum($w), 0.5, '', 0, 0, 'C', $fill);
                $this->Ln(0.5);
                // Code
                $row_h1 = $this->getNumLines($row["code"], $w[0]);
                $this->MultiCell($w[0], $h, $row["code"], 0, $a[0], $fill, 0, '', '', true, 0, false, true, 0, 'T', false);
                // Description
                $row_h2 = $this->getNumLines($row["description"], $w[1]);
                $this->MultiCell($w[1], $h, $row["description"], 0, $a[1], $fill, 0, '', '', true, 0, false, true, 0, 'T', false);
                // Unit
                $unit_cell = "";
                if ($row["unit_id"] > 0 && array_key_exists($row["unit_id"], $parameters)) {
                    $unit_cell = " " . $parameters[$row["unit_id"]]["name"];
                }
                // Quantity
                $this->MultiCell($w[2], $h, ((double) ($row["quantity"])) . $unit_cell, 0, $a[2], $fill, 0, '', '', true, 0, false, true, 0, 'T', false);
                // Price
                $this->MultiCell($w[3], $h, number_format($row["price"], 2, ".", " "), 0, $a[3], $fill, 0, '', '', true, 0, false, true, 0, 'T', false);
                // Total
                $this->MultiCell($w[4], $h, number_format($row["nettotal"], 2, ".", " "), 0, $a[4], $fill, 0, '', '', true, 0, false, true, 0, 'T', false);
                // Returning to new line
                if ($row_h1 >= $row_h2) {
                    $this->Ln($h * $row_h1);
                } else if ($row_h1 < $row_h2) {
                    $this->Ln($h * $row_h2);
                } else {
                    $this->Ln($h);
                }
                // Alterning with gray background
                $fill = !$fill;
                // Calculating the total quantity
                $quantity += (double) $row["quantity"];
            }
        }
        // Closing line
        $this->SetLineWidth(.2);
        $this->Cell(array_sum($w), $h, '', 'T');
        $this->Ln(1);

        // Total amounts
        $this->SetFont($fontName, '', $s);

        // Total quantity and Gross
        $this->Cell($w[0] + $w[1], $h);
        $this->Cell($w[2], $h, $quantity, 0, 0, $a[2]);
        $this->Cell($w[3], $h, $parameters["400007"]["value"], 0, 0, $a[3]);
        if ($total != 0.0) {
            $this->Cell($w[4], $h, number_format($total, 2, ".", " "), 0, 0, $a[4]);
        } else {
            $this->Cell($w[4], $h, number_format($order["price"], 2, ".", " "), 0, 0, $a[4]);
        }
        $this->Ln();

        // Discount
        if ($order["discount"] != 0.0) {
            $this->Cell($w[0] + $w[1], $h);
            $this->Cell($w[2] + $w[3], $h, $parameters["400009"]["value"], 0, 0, 'R');
            $this->Cell($w[4], $h, number_format($order["discount"], 2, ".", " "), 0, 0, 'R');
            $this->Ln();
        }

        // Subtotal
        if ($order["price"] != $order["subtotal"]) {
            $this->Cell($w[0] + $w[1], $h);
            $this->Cell($w[2] + $w[3], $h, $parameters["400010"]["value"], 0, 0, 'R');
            $this->Cell($w[4], $h, number_format($order["subtotal"], 2, ".", " "), 0, 0, 'R');
            $this->Ln();
        }

        // Tax
        if ($order["tax"] != 0.0) {
            $this->Cell($w[0] + $w[1], $h);
            $this->Cell($w[2] + $w[3], $h, $parameters["400012"]["value"] . " (" . number_format($order["tax_input"], 2, ".", " ") . "%)", 0, 0, 'R');
            $this->Cell($w[4], $h, number_format($order["tax"], 2, ".", " "), 0, 0, 'R');
            $this->Ln();
        }

        // Closing line
        $this->SetLineWidth(.4);
        $this->Ln(1);
        $this->Cell($table_width, $h, '', 'T');
        $this->Ln(1);

        // Final line
        $totalAmount = 0;
        $totalDefault = 0;
        if ($total != 0.0) {
            $totalAmount = $total;
            $letterTotal = $total;
        } else {
            $totalAmount = $order["nettotal"];
            $letterTotal = $order["nettotal"];
        }

        // Total Amount Spellout
        if ($form_type_id == 409002) { // voucher
            if ($totalAmount !== 0) {
                $this->SetFont($fontName, '', $s - 2);
                $numFormat = new NumberFormatter($lang_code, NumberFormatter::SPELLOUT);
                $this->Cell($w[0] + $w[1] + $w[2], $h, $numFormat->format(number_format($totalAmount, 2, ".", "")), 0, 0, 'L');
            } else {
                $this->Cell($w[0] + $w[1] + $w[2], $h);
            }
            $this->SetFont($fontName, 'B', $s);
            $this->Cell($w[3] + $w[4] + $w[5], $h, $label_total . " " . $parameters[$currency_id]["name"], 0, 0, 'R');
            $this->Cell($w[6], $h, number_format($totalAmount, 2, ".", " "), 0, 0, 'R');
            $this->Ln();            
        } else {
            if ($totalAmount !== 0) {
                $this->SetFont($fontName, '', $s - 2);
                $numFormat = new NumberFormatter($lang_code, NumberFormatter::SPELLOUT);
                $this->Cell($w[0] + $w[1], $h, $numFormat->format(number_format($totalAmount, 2, ".", "")), 0, 0, 'L');
            } else {
                $this->Cell($w[0] + $w[1], $h);
            }
            $this->SetFont($fontName, 'B', $s);
            $this->Cell($w[2] + $w[3], $h, $label_total . " " . $parameters[$currency_id]["name"], 0, 0, 'R');
            $this->Cell($w[4], $h, number_format($totalAmount, 2, ".", " "), 0, 0, 'R');
            $this->Ln();
        }
        
        // Final line (total default currency)
        if ($total_currency_id != $currency_id) {
            $totalDefault = 0;
            if ($total_currency_rate != 0.0) {
                if ($total != 0.0) {
                    $totalDefault = $total * $total_currency_rate / $currency_rate;
                } else {
                    $totalDefault = $order["nettotal"] * $total_currency_rate / $currency_rate;
                }
            }
            // Total Amount Spellout
            if ($form_type_id == 409002) { // voucher
                if ($totalDefault !== 0) {
                    $this->SetFont($fontName, '', $s - 2);
                    $numFormat = new NumberFormatter($lang_code, NumberFormatter::SPELLOUT);
                    $this->Cell($w[0] + $w[1] + $w[2], $h, $numFormat->format(number_format($totalDefault, 2, ".", "")), 0, 0, 'L');
                } else {
                    $this->Cell($w[0] + $w[1] + $w[2], $h);
                }
                $this->SetFont($fontName, 'B', $s);
                $this->Cell($w[3] + $w[4] + $w[5], $h, $label_total . " " . $parameters[$total_currency_id]["name"], 0, 0, 'R');
                $this->Cell($w[6], $h, number_format($totalDefault, 2, ".", " "), 0, 0, 'R');
                $this->Ln();
            } else {
                if ($totalDefault !== 0) {
                    $this->SetFont($fontName, '', $s - 2);
                    $numFormat = new NumberFormatter($lang_code, NumberFormatter::SPELLOUT);
                    $this->Cell($w[0] + $w[1], $h, $numFormat->format(number_format($totalDefault, 2, ".", "")), 0, 0, 'L');
                } else {
                    $this->Cell($w[0] + $w[1], $h);
                }
                $this->SetFont($fontName, 'B', $s);
                $this->Cell($w[2] + $w[3], $h, $label_total . " " . $parameters[$total_currency_id]["name"], 0, 0, 'R');
                $this->Cell($w[4], $h, number_format($totalDefault, 2, ".", " "), 0, 0, 'R');
                $this->Ln();
            }
        }

        // Closing line
        $this->SetLineWidth(.4);
        $this->Ln(1);
        $this->Cell($table_width, $h, '', 'T');
        $this->Ln(1);

        // Old Balances
        if (count($balances_old) > 0) {
            $this->SetFont($fontName, '', $s - 1);
            $this->Cell($w[0], $h, $parameters["400025"]["value"] . " ", 0, 0, 'L');
            foreach ($balances_old as $row) {
                $this->Cell($w[4], $h, $parameters[$row["currency_id"]]["name"] . " " . number_format($row["balance"], 2, ".", ""), 0, 0, 'L');
            }
            $this->Ln();
        }
        // New Balances
        if (count($balances_new) > 0) {
            $this->SetFont($fontName, '', $s - 1);
            $this->Cell($w[0], $h, $parameters["400026"]["value"] . " ", 0, 0, 'L');
            foreach ($balances_new as $row) {
                $this->Cell($w[4], $h, $parameters[$row["currency_id"]]["name"] . " " . number_format($row["balance"], 2, ".", ""), 0, 0, 'L');
            }
            $this->Ln();
        }
        $this->Ln();

        // Note
        if (isset($order["note"]) && strlen(trim($order["note"])) > 0) {
            $this->SetFont($fontName, 'B', $s);
            $this->Cell($w[1], $h, $parameters["400024"]["value"], 0, 0, 'L');
            $this->Ln();
            $this->SetFont($fontName, '', $s);
            $this->Write($h, $order["note"]);
        }

        // Page footer
        // Position at 1.5 cm from bottom
        $this->SetY(-25);        
        // Footer note
        if (strlen($parameters["400071"]["value"]) > 0) {
            $this->SetFont($fontName, '', 8);
            $this->Write(0, $parameters["400071"]["value"]);
        }
    }

}

// Parameters data
require_once("tools.php");
$params = Tools::getParams($isBase64);

// Database
require_once("database.php");
$db = new Database;

// Creating and displaying PDF output
//$pdf = new PDF();
$pdf = new PDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
$pdf->AddPage(); // adding the first page
$pdf->Generate($db, $params); // drawing and filling the table
$pdf->Output(); // displaying output
// Closing connection
$db->close();
