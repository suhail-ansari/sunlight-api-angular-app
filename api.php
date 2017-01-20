<?php 

    $base_url = "http://104.198.0.197:8080";
    
    // get all legislators
    function getAllLegislators(){

        global $base_url, $api_key, $cache;
        
        $url = $base_url."/legislators?apikey=$api_key&per_page=all";
        
        header('Content-Type: application/json');
        try{
            $res = file_get_contents($url);
            echo $res;
        } catch (Exception $e) {
            http_response_code(500); 
            echo "";
        }
    }

    // get legislator details
    function getLegislatorCommittees(){
        global $base_url, $api_key, $cache;

        $bioguide_id = $_GET['bioguide_id'];
        
        $url = $base_url."/committees?apikey=$api_key&member_ids=$bioguide_id&per_page=5&page=1";
        
        header('Content-Type: application/json');
        try{
            $res = file_get_contents($url);
            echo $res;
        } catch (Exception $e) {
            http_response_code(500); 
            echo "";
        }
    }

    function getLegislatorBills(){
        global $base_url, $api_key, $cache;

        $bioguide_id = $_GET['bioguide_id'];
        
        $url = $base_url."/bills?apikey=$api_key&sponsor_id=$bioguide_id&per_page=5&page=1";
        
        header('Content-Type: application/json');
        try{
            $res = file_get_contents($url);
            echo $res;
        } catch (Exception $e) {
            http_response_code(500); 
            echo "";
        }
    }

    function getAllBills($active){

        global $base_url, $api_key, $cache;
        
        $url = $base_url."/bills?apikey=$api_key&per_page=50&page=1&last_version.urls.pdf__exists=true&order=introduced_on";
        $url = ($active)?($url."&history.active=true"):($url."&history.active=false");
        
        header('Content-Type: application/json');
        try{
            $res = file_get_contents($url);
            echo $res;
        } catch (Exception $e) {
            http_response_code(500); 
            echo "";
        }
    }

    function getCommitees(){
        global $base_url, $base_alt_url, $api_key;
        
        $chamber = $_GET['chamber'];
        $url = $base_url."/committees?apikey=$api_key&per_page=all&chamber=$chamber";
        
        header('Content-Type: application/json');
        try{
            $res = file_get_contents($url);
            echo $res;
        } catch (Exception $e) {
            http_response_code(500); 
            echo "";
        }
    }

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = explode("/", $path); 
    $path = array_pop($path);
    
    switch ($path)
    {
        case "legislator":
            getAllLegislators();
            break;
        
        case "legislator-committees":
            getLegislatorCommittees();
            break;
        
        case "legislator-bills":
            getLegislatorBills();
            break;
        case "bills":
            getAllBills(true);
            break;
        case "new-bills":
            getAllBills(false);
            break;
        case "committee":
            getCommitees();
            break;
        default:
            http_response_code(404);
            break;
    }

?>